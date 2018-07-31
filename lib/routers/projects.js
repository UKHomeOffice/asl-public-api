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
  const { Profile, Project } = req.models;
  Promise.resolve()
    .then(() => {
      return Project.findOne({
        where: {
          id: req.params.id,
          establishmentId: req.establishment.id
        },
        include: {
          model: Profile,
          as: 'licenceHolder'
        }
      });
    })
    .then(project => {
      res.response = project;
      next();
    })
    .catch(next);
});

module.exports = router;
