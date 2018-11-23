const { Router } = require('express');

const router = Router();

router.use((req, res, next) => {
  req.profileId = req.user.profile.id;
  next();
});

router.use((req, res, next) => {
  Promise.resolve()
    .then(() => req.user.allowedActions())
    .then(allowedActions => {
      res.meta.allowedActions = allowedActions;
    })
    .then(() => next())
    .catch(next);
});

router.use(require('./profile'));

router.use((req, res, next) => {
  const { Invitation } = req.models;
  Promise.resolve()
    .then(() => Invitation.query().where({ email: req.user.profile.email }))
    .then(invitations => {
      res.response = {
        ...res.response,
        invitations
      };
    })
    .then(() => next())
    .catch(next);
});

router.use('/tasks', require('./task'));

module.exports = router;
