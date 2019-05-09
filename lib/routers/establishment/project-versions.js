const { Router } = require('express');
const isUUID = require('uuid-validate');
const { permissions } = require('../../middleware');
const { NotFoundError, BadRequestError } = require('../../errors');

const perms = task => permissions(task, req => ({ licenceHolderId: req.project.licenceHolderId }));

const router = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    model: 'projectVersion',
    meta: req.body.meta,
    data: req.body.data
  };

  return Promise.resolve()
    .then(() => req.workflow.update({
      ...params,
      id: req.version.id,
      action: req.params.action || action
    }))
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

router.param('id', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }
  const { ProjectVersion } = req.models;
  Promise.resolve()
    .then(() => ProjectVersion.get(req.params.id))
    .then(version => {
      if (!version) {
        throw new NotFoundError();
      }
      req.version = version;
      next();
    })
    .catch(next);
});

const canUpdate = allowedStatus => (req, res, next) => {
  if (req.version.status !== allowedStatus) {
    return next(new BadRequestError());
  }
  return next();
};

const validateAction = (req, res, next) => {
  const allowed = ['update', 'patch'];

  if (allowed.includes(req.params.action)) {
    return next();
  }
  return next(new BadRequestError());
};

const validatePayload = (req, res, next) => {
  const data = req.body.data;
  const allowed = ['conditions', 'protocolId'];
  Object.keys(data).forEach(key => {
    if (!allowed.includes(key)) {
      return next(new BadRequestError());
    }
  });
  return next();
};

router.get('/:id',
  perms('project.read.single'),
  (req, res, next) => {
    res.response = req.version;
    next();
  }
);

router.put('/:id/conditions',
  perms('project.updateConditions'),
  validatePayload,
  canUpdate('submitted'),
  submit('updateConditions'),
  (req, res, next) => {
    next('router');
  }
);

router.put('/:id/:action',
  perms('project.update'),
  validateAction,
  canUpdate('draft'),
  submit()
);

router.post('/:id/submit',
  perms('project.update'),
  submit('submit')
);

router.post('/:id/withdraw',
  perms('project.update'),
  submit('withdraw')
);

module.exports = router;
