const { Router } = require('express');
const { NotFoundError } = require('../../errors');

const router = Router({ mergeParams: true });

const accept = () => (req, res, next) => {
  const params = {
    action: 'accept',
    model: 'invitation'
  };
  req.workflow.update(req, params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

router.param('token', (req, res, next, token) => {
  const { Invitation } = req.models;
  Invitation.query().where({ token: req.params.token })
    .then(result => result[0])
    .then(invitation => {
      if (!invitation) {
        throw new NotFoundError();
      }
      req.invitation = invitation;
      next();
    })
    .catch(next);
});

router.get('/:token', (req, res, next) => {
  const { Establishment } = req.models;
  return Establishment.query().findById(req.invitation.establishmentId)
    .then(establishment => {
      res.response = req.invitation;
      res.meta.establishment = establishment;
      next();
    })
    .catch(next);
});

router.put('/:token', (req, res, next) => {
  req.body = {
    id: req.invitation.id,
    profileId: req.user.profile.id
  };
  next();
}, accept());

module.exports = router;
