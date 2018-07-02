const { Router } = require('express');
const permissions = require('../middleware/permissions');

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'place',
      data: req.body,
      id: req.params.id
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

router.put('/:id', permissions('place.update'), submit('update'));

router.delete('/:id', permissions('place.delete'), submit('delete'));

module.exports = router;
