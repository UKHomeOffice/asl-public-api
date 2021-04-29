const { Router } = require('express');
const { permissions, whitelist } = require('../../middleware');

const update = () => (req, res, next) => {
  const params = {
    id: req.profileId,
    model: 'emailPreferences',
    data: {
      ...req.body.data,
      profileId: req.profileId
    }
  };

  return req.workflow.update(params)
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

module.exports = () => {
  const router = Router();

  router.use(
    permissions('profile.update', req => ({ profileId: req.profileId }))
  );

  router.get('/', (req, res, next) => {
    return Promise.resolve()
      .then(() => req.models.EmailPreferences.query().findOne({ profileId: req.profileId }))
      .then(emailPreferences => {
        res.response = emailPreferences || {};
      })
      .then(() => next())
      .catch(next);
  });

  router.put('/',
    whitelist('preferences'),
    update()
  );

  return router;
};
