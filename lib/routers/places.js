const { Router } = require('express');
const permissions = require('../middleware/permissions');

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'place',
      data: req.body,
      id: res.place && res.place.id
    };
    req.queue(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const router = Router({ mergeParams: true });

router.param('id', (req, res, next, id) => {
  const { Role, Place, Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return Place.findOne({
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
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }
      res.place = place;
      next();
    })
    .catch(next);
});

router.get('/', (req, res, next) => {
  const { Role, Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return req.establishment.getPlaces({
        where: req.where,
        include: {
          model: Role,
          as: 'nacwo',
          include: {
            model: Profile
          }
        },
        order: [['site', 'ASC'], ['area', 'ASC'], ['name', 'ASC']]
      });
    })
    .then(result => {
      res.response = result;
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
