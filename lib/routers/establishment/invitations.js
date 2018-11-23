const { Router } = require('express');
const permissions = require('../../middleware/permissions');

const app = Router({ mergeParams: true });

app.get('/', permissions('profile.invite'), (req, res, next) => {
  const { Invitation } = req.models;
  const { limit, offset, sort } = req.query;

  return Promise.resolve()
    .then(() => Invitation.getInvitations({
      establishmentId: req.establishment.id,
      limit,
      offset,
      sort
    }))
    .then(({ total, invitations }) => {
      res.meta.count = invitations.total;
      res.meta.total = total;
      res.response = invitations.results;
    })
    .then(() => next())
    .catch(next);
});

module.exports = app;
