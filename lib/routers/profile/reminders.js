const { Router } = require('express');
const { permissions } = require('../../middleware');

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.use(permissions('profile.reminders', req => ({ profileId: req.profileId })));

  router.put('/:reminderId/dismiss', (req, res, next) => {
    const params = {
      id: req.params.reminderId,
      model: 'reminder',
      action: 'dismiss',
      data: {
        profileId: req.profileId
      }
    };

    return req.workflow.update(params)
      .then(response => {
        res.response = {};
        next();
      })
      .catch(next);
  });

  return router;
};
