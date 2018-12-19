const { Router } = require('express');
const isUUID = require('uuid-validate');
const { permissions, whitelist, validateSchema } = require('../../middleware');
const { NotFoundError } = require('../../errors');

const update = () => (req, res, next) => {
  const params = {
    model: 'profile',
    id: req.profileId,
    data: req.body.data,
    meta: req.body.meta
  };

  req.workflow.update(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validate = () => {
  return (req, res, next) => {
    return validateSchema(req.models.Profile, {
      ...(req.user.profile || {}),
      ...req.body.data
    })(req, res, next);
  };
};

const getSingleProfile = req => {
  if (!isUUID(req.profileId)) {
    throw new NotFoundError();
  }
  const { Profile } = req.models;
  const profile = Profile.scopeSingle({
    id: req.profileId,
    userId: req.user.profile.id,
    establishmentId: (req.establishment && req.establishment.id) || undefined
  });

  // own profile
  if (req.profileId === req.user.profile.id) {
    return profile.get();
  }

  return Promise.resolve()
    .then(() => req.user.can('profile.read.all', req.params))
    .then(allowed => {
      if (allowed) {
        return profile.get();
      }
      return Promise.resolve()
        .then(() => req.user.can('profile.read.basic', req.params))
        .then(allowed => {
          if (allowed) {
            return profile.getNamed();
          }
          throw new NotFoundError();
        });
    })
    .then(profile => {
      if (!profile) {
        throw new NotFoundError();
      }
      return profile;
    });
};

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  Promise.resolve()
    .then(() => getSingleProfile(req))
    .then(profile => {
      res.response = profile;
      next();
    })
    .catch(next);
});

router.put('/',
  permissions('profile.update', req => ({ id: req.profileId })),
  whitelist('firstName', 'lastName', 'dob', 'telephone'),
  validate(),
  update()
);

module.exports = router;
