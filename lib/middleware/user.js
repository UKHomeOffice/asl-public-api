const { Router } = require('express');
const { UnauthorisedError } = require('../errors');

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
      if (!profile) {
        throw new UnauthorisedError('No associated profile');
      }
      req.profile = profile;
      next();
    })
    .catch(next);
});

module.exports = router;
