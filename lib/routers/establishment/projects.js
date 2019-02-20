const { Router } = require('express');
const { NotFoundError } = require('../../errors');
const { fetchOpenTasks, permissions } = require('../../middleware');

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
      return ProjectVersion.query()
        .where({ projectId: project.id })
        .whereNotNull('grantedAt')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .then(versions => {
          if (!versions.length) {
            return ProjectVersion.query()
              .where({ projectId: project.id })
              .orderBy('createdAt', 'desc')
              .limit(1);
          }
          return versions;
        })
        .then(versions => versions[0])
        .then(version => {
          req.project = {
            ...project,
            version
          };
          next();
        });
    })
    .catch(next);
}, fetchOpenTasks);

router.get('/:id',
  permissions('project.read.single', (req, res) => ({ licenceHolderId: req.project.licenceHolderId })),
  (req, res, next) => {
    res.response = req.project;
    next();
  }
);

router.post('/',
  permissions('project.apply'),
  submit('create')
);

router.delete('/:id',
  permissions('project.update', (req, res) => ({ licenceHolderId: req.project.licenceHolderId })),
  submit('delete')
);

router.use('/:id/project-version(s)?', require('./project-versions'));

module.exports = router;
