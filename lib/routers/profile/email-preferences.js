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

  router.get('/', async (req, res, next) => {
    const {EmailPreferences} = await req.models;
    try {
      const emailPreferences = await EmailPreferences.query().findOne({ profileId: req.profileId });

      res.response = emailPreferences || {};
      next();
    } catch (error) {
      next(error);
    }
  });

  router.put('/',
    whitelist('preferences'),
    update()
  );

  return router;
};
