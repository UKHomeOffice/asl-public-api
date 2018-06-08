const { Router } = require('express');

const router = Router({ mergeParams: true });

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

router.get('/', (req, res, next) => {
  const { Role, Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return req.establishment.getPlaces({
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

module.exports = router;
