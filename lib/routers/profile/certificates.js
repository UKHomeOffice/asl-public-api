const { Router } = require('express');
const { validateSchema } = require('../../middleware');

const router = Router();

const submit = action => (req, res, next) => {
  const params = {
    action,
    model: 'certificate',
    data: {
      ...req.body,
      profileId: req.profileId
    },
    id: req.certificateId
  };

  return req.workflow(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validateCertificate = (req, res, next) => {
  return validateSchema(req.models.Certificate, {
    ...req.body,
    profileId: req.profileId
  })(req, res, next);
};

router.param('certificate', (req, res, next, certificate) => {
  req.certificateId = certificate;
  next();
});

router.post('/', validateCertificate, submit('create'));
router.delete('/:certificate', submit('delete'));

module.exports = router;
