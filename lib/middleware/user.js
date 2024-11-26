const { Router } = require('express');

const router = Router();

router.use(async (req, res, next) => {
  const { Profile } = await req.models;

  const getProfile = async () => {
    return await Profile.query()
      .where({ userId: req.user.id })
      .withGraphFetched('establishments')
      .first();
  };

  const createProfile = () => {
    const params = {
      model: 'profile',
      data: {
        userId: req.user.id,
        firstName: req.user._auth.given_name,
        lastName: req.user._auth.family_name,
        email: req.user._auth.email,
        emailConfirmed: req.user._auth.email_verified
      }
    };

    return req.workflow.create(params);
  };

  const confirmEmail = () => {
    const params = {
      model: 'profile',
      action: 'confirm-email',
      id: req.user.profile.id,
      data: {}
    };

    return req.workflow.update(params);
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
    })
    .then(() => {
      if (!req.user.profile.emailConfirmed && req.user._auth.email_verified) {
        return confirmEmail()
          .then(() => {
            req.user.profile.emailConfirmed = true;
          });
      }
    })
    .then(() => next())
    .catch(next);
});

module.exports = router;
