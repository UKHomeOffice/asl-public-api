const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Role } = req.models;
  Promise.resolve()
    .then(() => {
      return Role.query()
        .where({
          establishmentId: req.establishment.id
        })
        .eager('[profile, places]')
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
      return Role.query()
        .findById(req.params.id)
        .where('establishmentId', req.establishment.id)
        .eager('[profile, places]')
    })
    .then(role => {
      res.response = role;
      next();
    })
    .catch(next);
});

module.exports = router;
