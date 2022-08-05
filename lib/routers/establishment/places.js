const { Router } = require('express');
const { get, difference } = require('lodash');
const isUUID = require('uuid-validate');
const { NotFoundError, BadRequestError } = require('../../errors');
const { fetchOpenTasks, permissions, validateSchema, whitelist, updateDataAndStatus } = require('../../middleware');

const byLastName = (roleA, roleB) => {
  return roleA.profile.lastName < roleB.profile.lastName ? -1 : 1;
};

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
      res.response = response.json.data;
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

const validateRoles = (req, res, next) => {
  const { Role } = req.models;
  const roleIds = get(req, 'body.data.roles') || [];
  Promise.resolve()
    .then(() => {
      return Role.query()
        .select('id')
        .where('establishmentId', req.establishment.id);
    })
    .then(result => {
      const validRoleIds = result.map(r => r.id);
      if (difference(roleIds, validRoleIds).length !== 0) {
        next(new BadRequestError('invalid role ids found'));
      }
      next();
    })
    .catch(next);
};

const router = Router({ mergeParams: true });

router.param('id', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }
  const { withDeleted } = req.query;
  const { Place } = req.models;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';
  Promise.resolve()
    .then(() => {
      return Place[queryType]()
        .findById(req.params.id)
        .where('places.establishmentId', req.establishment.id)
        .joinRoles();
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

router.get('/', permissions('place.list'), (req, res, next) => {
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
      places.results.map(place => {
        place.nacwos = place.roles.filter(r => r.type === 'nacwo').sort(byLastName);
        place.nvssqps = place.roles.filter(r => ['nvs', 'sqp'].includes(r.type)).sort(byLastName);
      });
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
  whitelist('site', 'area', 'name', 'suitability', 'holding', 'roles', 'restrictions'),
  validatePlace,
  validateRoles,
  updateDataAndStatus(),
  submit('create')
);

router.get('/:id',
  permissions('place.read'),
  (req, res, next) => {
    res.response = res.place;
    next();
  },
  fetchOpenTasks()
);

router.put('/:id',
  permissions('place.update'),
  whitelist('site', 'area', 'name', 'suitability', 'holding', 'roles', 'restrictions'),
  validatePlace,
  validateRoles,
  updateDataAndStatus(),
  submit('update')
);

router.delete('/:id',
  whitelist(),
  permissions('place.delete'),
  submit('delete')
);

module.exports = router;
