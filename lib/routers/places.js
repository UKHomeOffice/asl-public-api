const { Router } = require('express');

const router = Router({ mergeParams: true });

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
        order: [['site', 'ASC'], ['building', 'ASC'], ['floor', 'ASC'], ['name', 'ASC']]
      });
    })
    .then(result => {
      res.response = result;
      next();
    })
    .catch(next);
});

module.exports = router;
