const { Router } = require('express');
const { NotFoundError } = require('../../errors');

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

router.param('profileId', (req, res, next, profileId) => {
  req.profileId = profileId;
  next();
});

router.use('/:profileId', require('./person'));

router.use('/:profileId/certificate', require('./certificates'));
router.use('/:profileId/exemption', require('./exemptions'));
router.use('/:profileId/pil', require('./pil'));
router.use('/:profileId/permission', require('./permission'));
router.use('/:profileId/role', require('./role'));

module.exports = router;
