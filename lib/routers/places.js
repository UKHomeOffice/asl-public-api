const { Router } = require('express');
const permissions = require('../middleware/permissions');

const router = Router({ mergeParams: true });

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

router.post('/', permissions('place.create'), (req, res, next) => {
  res.response = {};
  next();
});

router.get('/:id', (req, res, next) => {
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
      res.response = place;
      next();
    })
    .catch(next);
});

router.put('/:id', permissions('place.update'), (req, res, next) => {
  res.response = {};
  next();
});

router.delete('/:id', permissions('place.delete'), (req, res, next) => {
  res.response = {};
  next();
});

module.exports = router;
