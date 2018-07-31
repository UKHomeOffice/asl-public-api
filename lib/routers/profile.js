const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Profile } = req.models;
  const { search, sort, filters, limit, offset } = req.query;

  Promise.all([
    Profile.getFilterOptions(req.establishment.id),
    Profile.count(req.establishment.id),
    Profile
      .searchAndFilter({
        search,
        limit,
        offset,
        sort,
        filters,
        establishmentId: req.establishment.id
      })
  ])
    .then(([filters, total, profiles]) => {
      res.meta.filters = filters;
      res.meta.total = total;
      res.meta.count = profiles.total;
      res.response = profiles.results;
      return next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const { Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.query()
        .findById(req.params.id)
        .where('establishments.id', req.establishment.id)
        .joinRelation('establishments')
        .eager('[roles.places, establishments, pil, projects, trainingModules]');
    })
    .then(profile => {
      res.response = profile;
      next();
    })
    .catch(next);
});

module.exports = router;
