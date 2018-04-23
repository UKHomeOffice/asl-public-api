const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Profile, Place } = req.models;
  Promise.resolve()
    .then(() => {
      return req.establishment.getRoles({
        include: [
          { model: Profile },
          { model: Place }
        ]
      });
    })
    .then(result => {
      res.response = result;
      next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const { Role, Profile, Place } = req.models;
  Promise.resolve()
    .then(() => {
      return Role.findOne({
        where: {
          id: req.params.id,
          establishmentId: req.establishment.id
        },
        include: [
          { model: Profile }
        ]
      });
    })
    .then(role => {
      return req.establishment.getPlaces({ where: { nacwoId: role.id } })
        .then(places => {
          return role;
        });
    })
    .then(role => {
      res.response = role;
      next();
    })
    .catch(next);
});

module.exports = router;
