const { Router } = require('express');
const permissions = require('@asl/service/lib/middleware/permissions');

const router = Router({ mergeParams: true });

router.get('/', permissions('establishment.list'), (req, res, next) => {
  const { Establishment } = req.models;
  Promise.resolve()
    .then(() => {
      return Establishment.findAll({
        where: req.where
      });
    })
    .then(result => {
      res.response = result;
      next();
    })
    .catch(next);
});

router.use('/:establishment', permissions('establishment.read'), (req, res, next) => {

  const { Establishment, Authorisation } = req.models;

  Promise.resolve()
    .then(() => {
      return Establishment
        .findOne({
          where: { id: req.params.establishment },
          include: [
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

router.get('/:establishment', (req, res, next) => {
  if (!req.establishment) {
    return next();
  }

  req.establishment.getPELH()
    .then(pelh => {
      res.response = Object.assign(req.establishment.toJSON(), { pelh });
      next();
    });
});

router.use('/:establishment', (req, res, next) => {
  if (!req.establishment) {
    const e = new Error('Not found');
    e.status = 404;
    return next(e);
  }
  next();
});

router.use('/:establishment/roles', require('./roles'));
router.use('/:establishment/place(s)?', require('./places'));
router.use('/:establishment/profile(s)?', require('./profile'));
router.use('/:establishment/project(s)?', require('./projects'));

module.exports = router;
