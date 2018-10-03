const { Router } = require('express');

const { NotFoundError } = require('../../errors');
const permissions = require('../../middleware/permissions');

const router = Router({ mergeParams: true });

router.param('establishment', (req, res, next, id) => {

  const { Establishment } = req.models;

  Promise.resolve()
    .then(() => {
      return Establishment.query()
        .findById(id)
        .eager('authorisations');
    })
    .then(result => {
      if (!result) {
        throw new NotFoundError();
      }
      req.establishment = result;
      next();
    })
    .catch(next);

});

router.get('/', permissions('establishment.list'), (req, res, next) => {
  let { limit, offset } = req.query;
  const { Establishment } = req.models;
  Promise.all([
    Establishment.count(),
    Establishment.paginate({
      query: Establishment.query(),
      limit,
      offset
    })
  ])
    .then(([total, establishments]) => {
      res.meta.total = total;
      res.meta.count = establishments.total;
      res.response = establishments.results;
      return next();
    })
    .catch(next);
});

router.use('/:establishment', permissions('establishment.read'));

router.get('/:establishment', (req, res, next) => {
  req.establishment.getPELH()
    .then(pelh => {
      res.response = Object.assign(req.establishment.toJSON(), { pelh });
      next();
    });
});

router.use('/:establishment/roles', require('./roles'));
router.use('/:establishment/place(s)?', require('./places'));
router.use('/:establishment/profile(s)?', require('./profile'));
router.use('/:establishment/project(s)?', require('./projects'));
router.use('/:establishment/invite-user', require('./invite-user'));

module.exports = router;
