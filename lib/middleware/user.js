const { omit } = require('lodash');
const { Router } = require('express');

const router = Router();

router.use((req, res, next) => {
  const { Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.query()
        .where({ userId: req.user.id })
        .eager('establishments');
    })
    .then(profiles => profiles[0])
    .then(profile => {
      if (profile.asru_user) {
        profile.asru = {
          admin: profile.asru_admin,
          licensing: profile.asru_licensing,
          inspector: profile.asru_inspector
        };
      }
      req.profile = omit(profile, 'asru_user', 'asru_admin', 'asru_licensing', 'asru_inspector');
    })
    .then(() => next())
    .catch(next);
});

router.use((req, res, next) => {
  Promise.resolve()
    .then(() => req.user.can())
    .then(response => response.json)
    .then(allowedActions => {
      req.allowedActions = allowedActions;
    })
    .then(() => next())
    .catch(next);
});

module.exports = router;
