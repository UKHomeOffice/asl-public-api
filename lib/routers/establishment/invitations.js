const { Router } = require('express');
const { NotFoundError } = require('@asl/service/errors');
const isUUID = require('uuid-validate');
const permissions = require('../../middleware/permissions');

const app = Router({ mergeParams: true });

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
  const { Invitation } = req.models;
  if (!isUUID(invitationId)) {
    throw new NotFoundError();
  }
  Invitation.query().findById(invitationId)
    .then(invitation => {
      if (!invitation) {
        throw new NotFoundError();
      }
      if (invitation.establishmentId !== req.establishment.id) {
        throw new NotFoundError();
      }
      req.invitationId = invitationId;
      req.invitation = invitation;
    })
    .then(() => next())
    .catch(next);
});

app.param('action', (req, res, next, action) => {
  const allowedActions = ['cancel', 'resend'];
  if (!allowedActions.includes(action)) {
    return next(new NotFoundError());
  }
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
  submit('update')
);

module.exports = app;
