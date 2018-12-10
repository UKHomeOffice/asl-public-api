const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../../errors');
const permissions = require('../../middleware/permissions');
const validateSchema = require('../../middleware/validate-schema');

const submit = action => (req, res, next) => {
  const params = {
    model: 'place',
    meta: req.body.meta,
    data: {
      ...(req.body.data || req.body),
      establishmentId: req.establishment.id
    }
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create(params);
        case 'update':
          return req.workflow.update({
            ...params,
            id: res.place.id
          });
        case 'delete':
          return req.workflow.delete({
            ...params,
            id: res.place.id
          });
      }
    })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validatePlace = (req, res, next) => {
  return validateSchema(req.models.Place, {
    ...(res.place || {}),
    ...req.body.data,
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
        .eager('nacwo');
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
