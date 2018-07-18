const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../errors');
const permissions = require('../middleware/permissions');

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

const router = Router({ mergeParams: true });

router.param('id', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }
  const { Role, Place, Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return Place.scope('all').findOne({
        where: {
          id: req.params.id,
          establishmentId: req.establishment.id
        },
        include: {
          model: Role,
          as: 'nacwo',
          include: {
            model: Profile
          }
        }
      });
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
  const { limit, offset } = req.query;
  const { Place, Role, Profile } = req.models;

  const where = { establishmentId: req.establishment.id };
  Promise.all([
    Place.getFilterOptions({ where }),
    Place.count({ where }),
    Place.findAndCountAll({
      where: { ...req.where, ...where },
      include: {
        model: Role,
        as: 'nacwo',
        include: {
          model: Profile
        }
      },
      limit,
      offset,
      order: req.order || [['site', 'ASC'], ['area', 'ASC'], ['name', 'ASC']]
    })
  ])
    .then(([filters, total, result]) => {
      req.filters = filters;
      res.response = { ...result, total };
      next();
    })
    .catch(next);

});

router.post('/', permissions('place.create'), submit('create'));

router.get('/:id', (req, res, next) => {
  res.response = res.place;
  next();
});

router.put('/:id', permissions('place.update'), submit('update'));

router.delete('/:id', permissions('place.delete'), submit('delete'));

module.exports = router;
