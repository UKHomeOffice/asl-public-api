const { Router } = require('express');
const isUUID = require('uuid-validate');
const { permissions } = require('../../middleware');
const { NotFoundError } = require('../../errors');

const router = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    model: 'projectVersion',
    meta: req.body.meta,
    data: req.body.data
  };

  return Promise.resolve()
    .then(() => {
      return req.workflow.update({
        ...params,
        id: res.version.id
      });
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
      res.version = version;
      next();
    })
    .catch(next);
});

router.get('/:id',
  permissions('project.read.single', (req, res) => ({ id: res.project.licenceHolderId })),
  (req, res, next) => {
    res.response = res.version;
    next();
  }
);

router.put('/:id',
  permissions('project.update', (req, res) => ({ id: res.project.licenceHolderId })),
  submit('update')
);

module.exports = router;
