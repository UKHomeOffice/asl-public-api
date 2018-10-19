const { omit } = require('lodash');
const { Router } = require('express');
const isUUID = require('uuid-validate');
const { permissions } = require('../../middleware');
const { validateSchema } = require('../../middleware');
const { NotFoundError } = require('../../errors');

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'profile',
      data: { ...req.body },
      id: req.profileId
    };

    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const validate = () => {
  return (req, res, next) => {
    const ignoredFields = ['comments'];
    return validateSchema(req.models.Profile, {
      ...(req.user.profile || {}),
      ...omit(req.body, ignoredFields)
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

const getAllProfiles = req => {
  const { Profile } = req.models;
  const { search, sort, filters, limit, offset } = req.query;

  const profiles = Profile.scopeToParams({
    establishmentId: (req.establishment && req.establishment.id) || undefined,
    userId: req.user.profile.id,
    search,
    limit,
    offset,
    sort,
    filters
  });

  return Promise.resolve()
    .then(() => req.user.can('profile.read.all', req.params))
    .then(allowed => {
      if (allowed) {
        return profiles.getAll();
      }
      return Promise.resolve()
        .then(() => req.user.can('profile.read.basic', req.params))
        .then(allowed => {
          if (allowed) {
            return profiles.getNamed();
          }
          throw new NotFoundError();
        });
    });
};

const router = Router({ mergeParams: true });

router.use((req, res, next) => {
  if (req.profileId) {
    return Promise.resolve()
      .then(() => getSingleProfile(req))
      .then(profile => {
        res.response = profile;
        next();
      })
      .catch(next);
  }
  Promise.resolve()
    .then(() => getAllProfiles(req))
    .then(({ filters, total, profiles }) => {
      res.meta.filters = filters;
      res.meta.total = total;
      res.meta.count = profiles.total;
      res.response = profiles.results;
      next();
    })
    .catch(next);
});

router.put('/', validate(), submit('update'));

router.use('/training', require('./training-modules'));

router.put('/:id',
  permissions('profile.update'),
  validate(),
  submit('update')
);

router.use('/:id/training', require('./training-modules'));
router.use('/:id/pil', require('./pil'));

module.exports = router;
