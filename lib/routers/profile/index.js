const { Router } = require('express');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../../errors');
const personRouter = require('./person');

const getAllProfiles = req => {
  const { Profile } = req.models;
  const { search, sort, filters, limit, offset } = req.query;
  let namedPeopleOnly = false;

  if (filters && filters.roles && filters.roles.includes('named')) {
    filters.roles = [];
    namedPeopleOnly = true;
  }

  const profiles = Profile.scopeToParams({
    establishmentId: (req.establishment && req.establishment.id) || undefined,
    userId: req.user.profile.id,
    search,
    limit,
    offset,
    sort,
    filters,
    includeSelf: !namedPeopleOnly
  });

  return Promise.resolve()
    .then(() => req.user.can('profile.read.all', req.params))
    .then(allowed => {
      if (allowed && !namedPeopleOnly) {
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

module.exports = (settings) => {
  const router = Router({ mergeParams: true });

  router.get('/', (req, res, next) => {
    Promise.resolve()
      .then(() => getAllProfiles(req))
      .then(({ filters, total, profiles }) => {
        res.meta.filters = filters.sort();
        res.meta.total = total;
        res.meta.count = profiles.total;
        res.response = profiles.results;
        next();
      })
      .catch(next);
  });

  router.param('profileId', (req, res, next, profileId) => {
    if (!isUUID(profileId)) {
      throw new NotFoundError();
    }
    req.profileId = profileId;
    next();
  });

  router.use('/:profileId', personRouter(settings));
  router.use('/:profileId/pil', require('./pil'));
  router.use('/:profileId/permission', require('./permission'));

  return router;
};
