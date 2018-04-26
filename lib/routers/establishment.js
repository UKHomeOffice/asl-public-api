const { Router } = require('express');

const router = Router({ mergeParams: true });

router.use((req, res, next) => {

  const { Establishment, Role, Place, Profile } = req.models;

  Promise.resolve()
    .then(() => {
      return Establishment
        .findOne({
          where: { id: req.params.establishment },
          include: [
            { model: Role, include: { model: Profile } },
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

router.use((req, res, next) => {
  if (!req.establishment) {
    const e = new Error('Not found');
    e.status = 404;
    return next(e);
  }
  next();
});

router.use('/places', require('./places'));
router.use('/roles', require('./roles'));
router.use('/profile(s)?', require('./profile'));

module.exports = router;
