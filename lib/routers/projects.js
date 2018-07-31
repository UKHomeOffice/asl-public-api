const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Project } = req.models;
  const { limit, offset, search, sort } = req.query;
  Promise.all([
    Project.count(req.establishment.id),
    Project.search({
      sort,
      limit,
      offset,
      search,
      establishmentId: req.establishment.id
    })
  ])
    .then(([total, projects]) => {
      res.response = {
        rows: projects.results,
        count: projects.total,
        total
      };
      next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const { Project } = req.models;
  Promise.resolve()
    .then(() => {
      return Project.query()
        .findById(req.params.id)
        .where('establishmentId', req.establishment.id)
        .eager('licenceHolder')
    })
    .then(project => {
      res.response = project;
      next();
    })
    .catch(next);
});

module.exports = router;
