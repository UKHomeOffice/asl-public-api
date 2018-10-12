const { Router } = require('express');

const router = Router();

router.use((req, res, next) => {
  req.profileId = req.profile.id;
  next();
});

router.use((req, res, next) => {
  Promise.resolve()
    .then(() => req.user.can())
    .then(response => response.json)
    .then(allowedActions => {
      res.meta.allowedActions = allowedActions;
    })
    .then(() => next())
    .catch(next);
});

router.use(require('./profile'));

module.exports = router;
