const { Router } = require('express');

const router = Router();

router.use((req, res, next) => {
  const { Profile } = req.models;

  const getProfile = () => {
    return Profile.query()
      .where({ userId: req.user.id })
      .eager('establishments')
      .then(profiles => profiles[0]);
  };

  const createProfile = () => {
    const params = {
      model: 'profile',
      data: {
        userId: req.user.id,
        firstName: req.user._auth.given_name,
        lastName: req.user._auth.family_name,
        email: req.user._auth.email
      }
    };

    return req.workflow.create(params);
  };

  const can = req.user.can;
  req.user.can = (...args) => {
    Object.defineProperty(req, 'permissionChecked', { value: true });
    return can(...args);
  };

  Promise.resolve()
    .then(() => getProfile())
    .then(profile => {
      if (!profile) {
        return createProfile()
          .then(() => getProfile());
      }
      return profile;
    })
    .then(profile => {
      req.user.profile = profile;
      next();
    })
    .catch(next);
});

module.exports = router;
