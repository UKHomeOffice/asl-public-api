const { get } = require('lodash');
const { Router } = require('express');
const { BadRequestError, NotFoundError } = require('../../errors');
const { fetchOpenTasks, permissions, whitelist, updateDataAndStatus } = require('../../middleware');

const router = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    data: {
      ...req.body.data,
      establishmentId: req.establishment.id,
      licenceHolderId: req.project
        ? req.project.licenceHolderId
        : req.user.profile.id
    },
    model: 'project',
    meta: req.body.meta || {
      changedBy: req.user.profile.id
    }
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create(params);
        case 'delete':
          return req.workflow.delete({
            ...params,
            id: req.project.id
          });
        case 'delete-amendments':
          return req.workflow.update({
            ...params,
            id: req.project.id,
            action: 'delete-amendments'
          });
        case 'update':
          return req.workflow.update({
            ...params,
            data: {
              ...params.data,
              ...req.body.data
            },
            id: req.project.id
          });
        case 'fork':
          return req.workflow.update({
            ...params,
            action: 'fork',
            id: req.project.id
          });
        case 'revoke':
          return req.workflow.update({
            ...params,
            action: 'revoke',
            id: req.project.id
          });
        default:
          if (req.action === 'grant') {
            return req.workflow.update({
              ...params,
              action: 'grant',
              id: req.project.id
            });
          }
          if (req.action === 'resubmit') {
            return req.workflow.task(req.taskId).status({ status: 'resubmitted', meta: params.meta });
          }
      }
    })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

const loadVersions = (req, res, next) => {
  const { ProjectVersion } = req.models;
  const { withDeleted } = req.query;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';
  return ProjectVersion[queryType]()
    .select('id', 'status', 'createdAt', 'asruVersion', 'updatedAt')
    .select(ProjectVersion.knex().raw('data->\'duration\' AS duration'))
    .where({ projectId: req.project.id })
    .orderBy('createdAt', 'desc')
    .then(versions => {
      // if most recent version is a draft, include this.
      const draft = versions && versions[0] && versions[0].status === 'draft' ? versions[0] : undefined;
      const withdrawn = versions && versions[0] && versions[0].status === 'withdrawn' ? versions[0] : undefined;
      // get most recent granted version.
      const granted = versions.find(v => v.status === 'granted');
      req.project = {
        ...req.project,
        granted,
        draft,
        withdrawn,
        versions
      };
      next();
    });
};

router.get('/', (req, res, next) => {
  const { Project } = req.models;
  const { limit, offset, search, sort, status = 'active' } = req.query;

  const projects = Project.scopeToParams({
    licenceHolderId: req.user.profile.id,
    establishmentId: req.establishment.id,
    status,
    search,
    offset,
    limit,
    sort,
    isAsru: req.user.profile.asruUser
  });

  Promise.resolve()
    .then(() => req.user.can('project.read.all', req.params))
    .then(allowed => {
      if (allowed) {
        return projects.getAll();
      }
      return Promise.resolve()
        .then(() => req.user.can('project.read.basic', req.params))
        .then(allowed => {
          if (allowed) {
            return projects.getOwn();
          }
          throw new NotFoundError();
        });
    })
    .then(({ total, projects }) => {
      res.meta.count = projects.total;
      res.meta.total = total;
      res.response = projects.results;
      next();
    })
    .catch(next);
});

router.param('projectId', (req, res, next, projectId) => {
  const { Project } = req.models;
  const { withDeleted } = req.query;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';

  Promise.resolve()
    .then(() => {
      return Project[queryType]()
        .findById(projectId)
        .where('establishmentId', req.establishment.id)
        .eager('licenceHolder');
    })
    .then(project => {
      if (!project) {
        throw new NotFoundError();
      }
      req.project = project;
      next();
    })
    .catch(next);
});

const canFork = (req, res, next) => {
  const version = get(req.project, 'versions[0]');
  if (!version) {
    return next(new NotFoundError());
  }
  // version can be forked, continue
  if (version.status !== 'draft') {
    return next();
  }
  // version cannot be forked, get version id
  res.response = {
    data: {
      id: version.id
    }
  };
  return next('route');
};

const canRevoke = (req, res, next) => {
  if (req.project.status !== 'active') {
    return next(new BadRequestError('only active projects can be revoked'));
  }
  return next();
};

const canDelete = (req, res, next) => {
  if (req.project.status !== 'inactive') {
    return next(new BadRequestError('Active projects cannot be deleted.'));
  }
  next();
};

router.get('/:projectId',
  permissions('project.read.single'),
  loadVersions,
  (req, res, next) => {
    res.response = req.project;
    next();
  },
  fetchOpenTasks
);

router.post('/',
  permissions('project.apply'),
  whitelist('version'),
  submit('create')
);

router.delete('/:projectId',
  permissions('project.update'),
  canDelete,
  submit('delete')
);

router.delete('/:projectId/draft-amendments',
  permissions('project.update'),
  submit('delete-amendments')
);

router.post('/:projectId/fork',
  permissions('project.update'),
  loadVersions,
  canFork,
  submit('fork')
);

router.put('/:projectId/update-licence-holder',
  permissions('project.update'),
  whitelist('licenceHolderId'),
  updateDataAndStatus(),
  submit('update')
);

router.put('/:projectId/revoke',
  permissions('project.revoke'),
  canRevoke,
  whitelist('comments'),
  submit('revoke')
);

router.post('/:projectId/grant',
  permissions('project.update'),
  (req, res, next) => {
    req.workflow.openTasks(req.project.id)
      .then(({ json: { data } }) => {
        if (!data || !data.length) {
          req.action = 'grant';
          return next();
        }
        req.taskId = data[0].id;
        req.action = 'resubmit';
        return next();
      });
  },
  submit()
);

router.use('/:projectId/project-version(s)?', require('./project-versions'));

module.exports = router;
