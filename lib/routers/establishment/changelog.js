const { Router } = require('express');

const router = Router();

router.get('/', (req, res, next) => {
  const { Changelog } = req.models;
  const { limit, offset, sort } = req.query;

  Promise.resolve()
    .then(() => {
      return Changelog.getChangelog({
        establishmentId: req.establishment.id,
        offset,
        limit,
        sort
      })
    })
    .then(result => {
      res.response = result.results;
      res.meta.total = result.total;
      next();
    })
    .catch(next);
});

module.exports = router;
