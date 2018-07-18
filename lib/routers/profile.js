const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Profile } = req.models;
  const { limit, offset, search } = req.query;

  const where = { ...req.where, establishmentId: req.establishment.id };

  Promise.all([
    Profile.getFilterOptions({ where }),
    Profile.searchAndCountAll({
      search,
      where,
      limit,
      offset,
      order: req.order
    })
  ])
    .then(([filters, result]) => {
      req.filters = filters;
      res.response = result;
      next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const { Establishment, Role, Place, Profile, PIL, Project, TrainingModule } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.findOne({
        where: {
          id: req.params.id
        },
        include: [
          {
            model: Establishment,
            where: {
              id: req.establishment.id
            }
          },
          {
            model: Role,
            include: {
              model: Place,
              required: false
            }
          },
          PIL,
          Project,
          TrainingModule
        ]
      });
    })
    .then(profile => {
      res.response = profile;
      next();
    })
    .catch(next);
});

module.exports = router;
