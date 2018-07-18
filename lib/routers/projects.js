const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Project } = req.models;
  const { limit, offset, search } = req.query;
  Project.searchAndCountAll({
    search,
    where: { ...req.where, establishmentId: req.establishment.id },
    offset,
    limit,
    order: req.order
  })
    .then(([total, result]) => {
      res.response = {
        ...result,
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
