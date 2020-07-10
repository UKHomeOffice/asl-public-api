const { Router } = require('express');
const { fetchOpenTasks } = require('../middleware');
const moment = require('moment');
const { UnauthorisedError } = require('../errors');
const personRouter = require('./profile/person');

module.exports = (settings) => {
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

  router.post('/verify', (req, res, next) => {
    const { username, password } = req.body;
    Promise.resolve()
      .then(() => req.user.verifyPassword(username, password))
      .then(isValid => {
        if (!isValid) {
          next(new UnauthorisedError());
        }
        res.response = { isValid };
      })
      .then(() => next())
      .catch(next);
  });

  router.use(personRouter(settings));

  router.use((req, res, next) => {
    const { Invitation } = req.models;
    Promise.resolve()
      .then(() => {
        return Invitation.query()
          .where('email', 'iLike', req.user.profile.email)
          .where('updatedAt', '>', moment().utc().subtract(7, 'days'))
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
  }, fetchOpenTasks());

  return router;
};
