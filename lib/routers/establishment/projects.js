const { Router } = require('express');
const { NotFoundError } = require('../../errors');
const { fetchOpenTasks, permissions } = require('../../middleware');

const perms = task => permissions(task, req => ({ licenceHolderId: req.project.licenceHolderId }));

const router = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    data: {
      establishmentId: req.establishment.id,
      licenceHolderId: req.user.profile.id
    },
    model: 'project'
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
        case 'grant':
          return req.workflow.update({
            ...params,
            action: 'grant',
            id: req.project.id
          });
        case 'fork':
          return req.workflow.update({
            ...params,
            action: 'fork',
            id: req.project.id
          });
      }
    })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
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
    sort
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

router.param('id', (req, res, next, id) => {
  const { Project, ProjectVersion } = req.models;

  Promise.resolve()
    .then(() => Project.query().findById(id).where('establishmentId', req.establishment.id))
    .then(project => {
      if (!project) {
        throw new NotFoundError();
      }
      return ProjectVersion.query()
        .select('id', 'grantedAt', 'submittedAt', 'createdAt')
        .where({ projectId: project.id })
        .orderBy('createdAt', 'desc')
        .then(versions => {
          const granted = versions.find(v => v.grantedAt) || null;
          if (granted) {
            // if a granted version exists, we're only interested in drafts created after
            versions = versions.filter(v => v.createdAt > granted.createdAt);
          }
          // only attach most recent draft
          const draft = versions[0] || null;
          return { granted, draft };
        })
        .then(versions => {
          req.project = {
            ...project,
            ...versions
          };
          next();
        });
    })
    .catch(next);
});

router.get('/:id',
  perms('project.read.single'),
  (req, res, next) => {
    res.response = req.project;
    next();
  },
  fetchOpenTasks
);

router.post('/',
  permissions('project.apply'),
  submit('create')
);

router.delete('/:id',
  perms('project.update'),
  submit('delete')
);

router.post('/:id/fork',
  perms('project.update'),
  submit('fork')
);

router.post('/:id/grant',
  perms('project.update'),
  submit('grant')
);

router.use('/:id/project-version(s)?', require('./project-versions'));

module.exports = router;
