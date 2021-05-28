const { Router } = require('express');
const isUUID = require('uuid-validate');
const { validateSchema, permissions } = require('../../middleware');
const { NotFoundError, BadRequestError } = require('../../errors');

const app = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    model: 'certificate',
    meta: req.body.meta,
    data: {
      ...req.body.data,
      profileId: req.profileId
    }
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create(params);
        case 'update':
          return req.workflow.update({
            ...params,
            id: req.certificateId
          });
        case 'delete':
          return req.workflow.delete({
            ...params,
            id: req.certificateId
          });
      }
    })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validateCertificate = () => (req, res, next) => {
  return validateSchema(req.models.Certificate, {
    ...req.body.data,
    profileId: req.profileId
  })(req, res, next);
};

app.param('certificateId', (req, res, next, certificateId) => {
  if (!isUUID(certificateId)) {
    return next(new BadRequestError());
  }
  const { Certificate } = req.models;
  Promise.resolve()
    .then(() => Certificate.query().where({ profileId: req.profileId }).findById(certificateId))
    .then(certificate => {
      if (!certificate) {
        return next(new NotFoundError());
      }
      req.certificateId = certificateId;
      req.certificate = certificate;
      next();
    })
    .catch(next);
});

app.get('/:certificateId', (req, res, next) => {
  res.response = req.certificate;
  next();
});

app.put('/:certificateId', permissions('training.update', req => ({ profileId: req.profileId })), submit('update'));
app.delete('/:certificateId', permissions('training.update', req => ({ profileId: req.profileId })), submit('delete'));
app.post('/', validateCertificate(), permissions('training.update', req => ({ profileId: req.profileId })), submit('create'));

app.get('/', permissions('training.read', req => ({ ...(req.query || {}), profileId: req.profileId })), (req, res, next) => {
  const { Certificate } = req.models;
  Certificate.query().where({ profileId: req.profileId })
    .then(certificates => {
      res.response = certificates;
      res.sendResponse();
    })
    .catch(next);
});

module.exports = app;
