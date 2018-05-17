const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Establishment } = req.models;
  Promise.resolve()
    .then(() => {
      return Establishment
        .findAll();
    })
    .then(result => {
      res.response = result;
      next();
    })
    .catch(next);
});

router.use('/:id', (req, res, next) => {

  const { Establishment, Role, Place, Profile, Authorisation } = req.models;

  Promise.resolve()
    .then(() => {
      return Establishment
        .findOne({
          where: { id: req.params.id },
          include: [
            { model: Role, include: { model: Profile } },
            { model: Place },
            { model: Authorisation }
          ]
        });
    })
    .then(result => {
      req.establishment = result;
      next();
    })
    .catch(next);

});

router.get('/:id', (req, res, next) => {
  res.response = req.establishment;
  next();
});

router.use('/:id', (req, res, next) => {
  if (!req.establishment) {
    const e = new Error('Not found');
    e.status = 404;
    return next(e);
  }
  next();
});

router.use('/:id/places', require('./places'));
router.use('/:id/roles', require('./roles'));
router.use('/:id/profile(s)?', require('./profile'));

module.exports = router;