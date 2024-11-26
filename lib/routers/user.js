const { Router } = require('express');
const moment = require('moment');
const { pick } = require('lodash');
const { fetchOpenTasks } = require('../middleware');
const { UnauthorisedError } = require('../errors');
const personRouter = require('./profile/person');
const emailPreferencesRouter = require('./profile/email-preferences');
const notificationsRouter = require('./profile/notifications');
const alertsRouter = require('./profile/alerts');
const remindersRouter = require('./profile/reminders');

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

  router.post('/resend-email', (req, res, next) => {
    const params = {
      model: 'profile',
      action: 'resend-email',
      id: req.user.profile.id
    };
    return req.workflow.update(params)
      .then(response => {
        res.response = response;
      })
      .then(() => next())
      .catch(next);
  });

  router.post('/confirm-email', (req, res, next) => {
    if (req.user.profile.emailConfirmed) {
      res.response = {};
      return next();
    }
    const params = {
      model: 'profile',
      action: 'confirm-email',
      id: req.user.profile.id,
      data: {}
    };
    return req.workflow.update(params)
      .then(response => {
        res.response = response;
      })
      .then(() => next())
      .catch(next);
  });

  router.use('/notification(s)?', notificationsRouter(settings));

  router.use('/email-preferences', emailPreferencesRouter(settings));

  router.use('/reminders', remindersRouter(settings));

  router.get('/', (req, res, next) => {
    if (!req.user.profile.emailConfirmed) {
      res.response = pick(req.user.profile, 'id', 'firstName', 'lastName', 'email');
      return next('router');
    }

    const params = {
      model: 'profile',
      action: 'updateLastLogin',
      id: req.user.profile.id
    };

    req.workflow.update(params)
      .catch(() => {
        /* do nothing */
      });
    next();
  });

  router.use(personRouter(settings));

  router.use('/alerts', alertsRouter(settings));

  router.get('/', async (req, res, next) => {
    const { Invitation } = await req.models;
    try {
      const invitations = await Invitation.query()
        .where('email', 'iLike', req.user.profile.email)
        .where('updatedAt', '>', moment().utc().subtract(7, 'days'))
        .withGraphFetched('establishment')
        .modifyGraph('establishment', (builder) => {
          builder.select('name'); // Specify the fields you want from the related model
        });

      res.response = {
        ...res.response,
        invitations
      };

      next();
    } catch (error) {
      next(error);
    }
  }, fetchOpenTasks());

  return router;
};
