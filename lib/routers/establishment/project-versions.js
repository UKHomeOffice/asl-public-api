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
    .then(() => {
      switch (action) {
        case 'update':
          return req.workflow.update({
            ...params,
            id: req.version.id
          });
        case 'submit':
          return req.workflow.update({
            ...params,
            id: req.version.id,
            action: 'submit'
          });
      }
    })
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

const canUpdate = (req, res, next) => {
  if (req.version.submittedAt || req.version.grantedAt) {
    return next(new BadRequestError());
  }
  return next();
};

router.get('/:id',
  perms('project.read.single'),
  (req, res, next) => {
    res.response = req.version;
    next();
  }
);

router.put('/:id',
  perms('project.update'),
  canUpdate,
  submit('update')
);

router.post('/:id/submit',
  perms('project.update'),
  submit('submit')
);

module.exports = router;
