const { Router } = require('express');
const { NotFoundError } = require('../../errors');

const router = Router({ mergeParams: true });

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
  const params = {
    action: 'accept',
    model: 'invitation',
    id: req.invitation.id,
    data: {
      id: req.invitation.id,
      profileId: req.user.profile.id
    }
  };
  req.workflow.update(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
});

module.exports = router;
