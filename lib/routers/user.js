const { Router } = require('express');
const { get } = require('lodash');
const { fetchOpenTasks } = require('../middleware');
const moment = require('moment');

const router = Router();

router.use((req, res, next) => {
  Promise.resolve()
    .then(() => req.user.allowedActions())
    .then(allowedActions => {
      res.meta.allowedActions = allowedActions;
    })
    .then(() => next())
    .catch(next);
});

router.use((req, res, next) => {
  req.profileId = req.user.profile.id;
  next();
});

router.post('/auth-token', (req, res, next) => {
  Promise.resolve()
    .then(() => req.user.grantToken(
      get(req.body, 'username'),
      get(req.body, 'password')
    ))
    .then(token => {
      res.response = { token };
    })
    .then(() => next())
    .catch(next);
});

router.use(require('./profile/person'));

router.use((req, res, next) => {
  const { Invitation } = req.models;
  Promise.resolve()
    .then(() => {
      return Invitation.query()
        .where('email', 'iLike', req.user.profile.email)
        .where('createdAt', '>', moment().utc().subtract(7, 'days'))
        .eager('establishment(name)', {
          name: builder => builder.select('name')
        });
    })
    .then(invitations => {
      res.response = {
        ...res.response,
        invitations
      };
    })
    .then(() => next())
    .catch(next);
}, fetchOpenTasks);

module.exports = router;
