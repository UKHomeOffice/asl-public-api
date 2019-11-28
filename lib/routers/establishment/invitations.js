const { Router } = require('express');
const { BadRequestError } = require('@asl/service/errors');
const permissions = require('../../middleware/permissions');

const app = Router({ mergeParams: true });

const validateAction = () => (req, res, next) => {
  const allowedActions = ['cancel', 'resend'];
  if (!allowedActions.includes(req.action)) {
    return next(new BadRequestError());
  }
  next();
};

const submit = action => (req, res, next) => {
  const params = {
    model: 'invitation',
    id: req.invitationId
  };

  return Promise.resolve()
    .then(() => {
      if (action === 'delete') {
        return req.workflow.delete(params);
      }
      return req.workflow.update({ ...params, action: req.action });
    })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

app.param('invitationId', (req, res, next, invitationId) => {
  req.invitationId = invitationId;
  next();
});

app.param('action', (req, res, next, action) => {
  req.action = action;
  next();
});

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

app.delete('/:invitationId',
  permissions('profile.invite'),
  submit('delete')
);

app.put('/:invitationId/:action',
  permissions('profile.invite'),
  validateAction(),
  submit('update')
);

module.exports = app;
