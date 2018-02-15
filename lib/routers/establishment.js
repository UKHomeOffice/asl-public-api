const { Router } = require('express');

const router = Router({ mergeParams: true });

router.use((req, res, next) => {

  const { Establishment, Role, Place } = req.models;

  Promise.resolve()
    .then(() => {
      return Establishment
        .findOne({
          where: { id: req.params.establishment },
          include: [
            { model: Role },
            { model: Place }
          ]
        });
    })
    .then(result => {
      req.establishment = result;
      next();
    })
    .catch(next);

});

router.get('/', (req, res, next) => {
  res.response = req.establishment;
  next();
});

router.use('/places', require('./places'));
router.use('/roles', require('./roles'));
router.use('/profile', require('./profile'));

module.exports = router;
