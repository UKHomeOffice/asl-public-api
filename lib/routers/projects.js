const { Router } = require('express');
const { NotFoundError } = require('../errors');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Project } = req.models;
  const { limit, offset, search, sort } = req.query;

  const projects = Project.scopeToParams({
    licenceHolderId: req.profile.id,
    establishmentId: req.establishment.id,
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

router.get('/:id', (req, res, next) => {
  const { Project } = req.models;

  const project = Project.scopeSingle({
    id: req.params.id,
    establishmentId: req.establishment.id,
    licenceHolderId: req.profile.id
  });

  Promise.resolve()
    .then(() => req.user.can('project.read.all', req.params))
    .then(allowed => {
      if (allowed) {
        return project.get();
      }
      return Promise.resolve()
        .then(() => req.user.can('project.read.all', req.params))
        .then(allowed => {
          if (allowed) {
            return project.getOwn();
          }
          throw new NotFoundError();
        });
    })
    .then(project => {
      res.response = project;
      next();
    })
    .catch(next);
});

module.exports = router;
