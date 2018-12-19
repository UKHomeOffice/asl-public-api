const { Router } = require('express');
const { NotFoundError } = require('../../errors');

const router = Router({ mergeParams: true });

const getAllProfiles = req => {
  const { Profile } = req.models;
  const { search, sort, filters, limit, offset } = req.query;

  const params = {
    userId: req.user.profile.id,
    search,
    limit,
    offset,
    sort,
    filters
  };

  return Promise.resolve()
    .then(() => req.user.can('profile.read.all', req.params))
    .then(allowed => {
      if (allowed) {
        return Profile.getProfilesUnscoped(params);
      }
      throw new NotFoundError();
    });
};

router.get('/', (req, res, next) => {
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

module.exports = router;
