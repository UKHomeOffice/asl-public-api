const { Router } = require('express');

module.exports = () => {
  const app = Router({ mergeParams: true });

  app.param('notificationId', (req, res, next, notificationId) => {
    const { Notification } = req.models;
    const profileId = req.profileId;

    Promise.resolve()
      .then(() => Notification.query().where({ profileId }).findById(notificationId))
      .then(notification => {
        req.notification = notification;
        req.notificationId = notificationId;
      })
      .then(() => next())
      .catch(next);
  });

  app.get('/', (req, res, next) => {
    const { Notification } = req.models;
    const { sort, limit, offset } = req.query;
    const profileId = req.profileId;

    function getNotifications() {
      let query = Notification.query()
        .where({ profileId });

      if (sort && sort.column) {
        query = Notification.orderBy({ query, sort });
      }

      return Notification.paginate({ query, limit, offset });
    }

    return Promise.all([
      Notification.query()
        .where({ profileId })
        .countDistinct('id')
        .then(results => results[0].count),
      getNotifications()
    ])
      .then(([total, notifications]) => {
        res.meta.total = total;
        res.meta.count = notifications.total;
        res.response = notifications.results;
        next();
      })
      .catch(next);
  });

  app.get('/:notificationId', (req, res, next) => {
    res.response = req.notification;
    next();
  });

  return app;
};
