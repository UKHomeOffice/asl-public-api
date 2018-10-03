const { omit } = require('lodash');
const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../../errors');
const permissions = require('../../middleware/permissions');
const validateSchema = require('../../middleware/validate-schema');

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'place',
      data: { ...req.body, establishment: req.establishment.id },
      id: res.place && res.place.id
    };
    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const validatePlace = (req, res, next) => {
  const ignoredFields = ['comments'];
  return validateSchema(req.models.Place, {
    ...(res.place || {}),
    ...omit(req.body, ignoredFields),
    establishmentId: req.establishment.id
  })(req, res, next);
};

const router = Router({ mergeParams: true });

router.param('id', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }
  const { Place } = req.models;
  Promise.resolve()
    .then(() => {
      return Place.query()
        .findById(req.params.id)
        .where('establishmentId', req.establishment.id)
        .eager('nacwo.profile');
    })
    .then(place => {
      if (!place) {
        throw new NotFoundError();
      }
      res.place = place;
      next();
    })
    .catch(next);
});

router.get('/', (req, res, next) => {
  let { limit, offset, filters, sort } = req.query;
  const { Place } = req.models;
  Promise.all([
    Place.getFilterOptions(req.establishment.id),
    Place.count(req.establishment.id),
    Place.filter({
      filters,
      sort,
      limit,
      offset,
      establishmentId: req.establishment.id
    })
  ])
    .then(([filters, total, places]) => {
      res.meta.filters = filters;
      res.meta.total = total;
      res.meta.count = places.total;
      res.response = places.results;
      return next();
    })
    .catch(next);
});

router.post('/',
  permissions('place.create'),
  validatePlace,
  submit('create')
);

router.get('/:id', (req, res, next) => {
  res.response = res.place;
  next();
});

router.put('/:id',
  permissions('place.update'),
  validatePlace,
  submit('update')
);

router.delete('/:id', permissions('place.delete'), submit('delete'));

module.exports = router;
