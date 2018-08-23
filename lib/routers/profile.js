const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../errors');
const permissions = require('../middleware/permissions');

const router = Router({ mergeParams: true });

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'invitation',
      data: { ...req.body, establishment: req.establishment.id },
      id: res.profile && res.profile.id
    };
    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const validateSchema = () => {
  return (req, res, next) => {
    let data = { ...req.body, establishmentId: req.establishment.id };

    if (res.profile) {
      data = Object.assign({}, res.place, data);
    }

    const { Profile } = req.models;
    const error = Profile.validate(data);

    return error ? next(error) : next();
  };
};

router.param('id', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }
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
      if (!profile) {
        throw new NotFoundError();
      }
      res.profile = profile;
      next();
    })
    .catch(next);
});

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
  res.response = res.profile;
  next();
});

router.post('/', permissions('profile.invite'), validateSchema(), submit('create'));

module.exports = router;
