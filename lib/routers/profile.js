const { omit } = require('lodash');
const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../errors');
const { validateSchema, permissions } = require('../middleware');

const router = Router({ mergeParams: true });

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'profile',
      data: { ...req.body, establishment: req.establishment.id },
      id: res.profile && res.profile.id
    };
    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const validateProfile = (req, res, next) => {
  const ignoredFields = ['comments'];
  return validateSchema(req.models.Profile, {
    ...(res.profile || {}),
    ...omit(req.body, ignoredFields)
  })(req, res, next);
};

router.param('id', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }
  const { Profile } = req.models;

  const profile = Profile.scopeSingle({
    id: req.params.id,
    establishmentId: req.establishment.id,
    userId: req.profile.id
  });

  Promise.resolve()
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
      res.profile = profile;
      next();
    })
    .catch(next);
});

router.get('/', (req, res, next) => {
  const { Profile } = req.models;
  const { search, sort, filters, limit, offset } = req.query;

  const profiles = Profile.scopeToParams({
    userId: req.profile.id,
    establishmentId: req.establishment.id,
    search,
    limit,
    offset,
    sort,
    filters
  });

  Promise.resolve()
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
    })
    .then(({ filters, total, profiles }) => {
      res.meta.filters = filters;
      res.meta.total = total;
      res.meta.count = profiles.total;
      res.response = profiles.results;
      return next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  res.response = res.profile;
  next();
});

router.put('/:id',
  permissions('profile.update'),
  validateProfile,
  submit('update')
);

module.exports = router;
