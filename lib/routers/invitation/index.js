const { Router } = require('express');

const router = Router({ mergeParams: true });

const submit = action => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'invitation',
      data: req.body
    };
    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

router.param('token', (req, res, next, token) => {
  const { Invitation } = req.models;
  Invitation.query().where({ token: req.params.token })
    .then(result => result[0])
    .then(invitation => {
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
    .catch(next)
});

router.put('/:token', (req, res, next) => {
  req.body = {
    id: req.invitation.id,
    profileId: req.user.profile.id
  };
  next();
}, submit('accept'));

module.exports = router;
