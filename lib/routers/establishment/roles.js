const { Router } = require('express');
const { fetchOpenTasks } = require('../../middleware');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Role } = req.models;
  const { type } = req.query;
  Promise.resolve()
    .then(() => {
      return Role.query()
        .skipUndefined()
        .where({
          type,
          establishmentId: req.establishment.id
        })
        .eager('[profile, places]');
    })
    .then(result => {
      res.response = result;
      next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const { Role } = req.models;
  Promise.resolve()
    .then(() => {
      return Role.query()
        .findById(req.params.id)
        .where('establishmentId', req.establishment.id)
        .eager('[profile, places]');
    })
    .then(role => {
      res.response = role;
      next();
    })
    .catch(next);
}, fetchOpenTasks);

module.exports = router;
