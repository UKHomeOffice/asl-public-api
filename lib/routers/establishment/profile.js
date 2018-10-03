const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../../errors');

const router = Router({ mergeParams: true });

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
  validate(),
  submit('update')
);

router.use('/:id/training', require('./training-modules'));
router.use('/:id/pil', require('./pil'));

module.exports = router;
