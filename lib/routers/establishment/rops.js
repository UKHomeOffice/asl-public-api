const { Router } = require('express');
const isUUID = require('uuid-validate');
const { BadRequestError } = require('../../errors');
const { whitelist, permissions } = require('../../middleware');

const submit = action => (req, res, next) => {
  const params = {
    action,
    model: 'rop',
    data: {
      ...req.body.data,
      establishmentId: req.establishment.id,
      projectId: req.project.id
    },
    meta: req.body.meta
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create(params);
        case 'update':
        case 'submit':
        case 'unsubmit':
          return req.workflow.update({ ...params, id: req.rop.id });
      }
    })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

function canUpdate(req, res, next) {
  if (req.rop.status !== 'draft') {
    return next(new BadRequestError('Cannot update once submitted'));
  }
  next();
}

function parseYear(req, res, next) {
  const { year } = req.body.data;
  req.body.data.year = parseInt(year, 10);

  next();
}

function canCreate(req, res, next) {
  const { year } = req.body.data;

  return Promise.resolve()
    .then(() => req.models.Rop.query().findOne({ projectId: req.project.id, year }))
    .then(rop => {
      if (rop) {
        return next(new BadRequestError(`A rop already exists for ${year}`));
      }
      next();
    })
    .catch(next);
}

const app = Router({ mergeParams: true });

app.param('ropId', (req, res, next, ropId) => {
  if (!isUUID(ropId)) {
    return next(new BadRequestError('Invalid Rop ID'));
  }
  const { Rop, ProjectVersion } = req.models;

  return Promise.resolve()
    .then(() => Rop.query().findById(ropId).withGraphFetched('procedures'))
    .then(rop => {
      return ProjectVersion.query().findById(req.project.granted.id)
        .then(granted => {
          req.rop = rop;
          req.rop.project = req.project;
          req.rop.project.granted = granted;
        });
    })
    .then(() => next())
    .catch(next);
});

app.post('/',
  permissions('project.rops.create'),
  parseYear,
  canCreate,
  submit('create')
);

app.put('/:ropId',
  permissions('project.rops.update'),
  canUpdate,
  whitelist(req => req.models.Rop.editableFields),
  submit('update')
);

app.post('/:ropId/submit',
  permissions('project.rops.submit'),
  submit('submit')
);

app.post('/:ropId/unsubmit',
  permissions('project.rops.submit'),
  submit('unsubmit')
);

app.get('/:ropId', permissions('project.rops.update'), (req, res, next) => {
  res.response = req.rop;
  next();
});

app.use('/:ropId/procedure(s)?', require('./procedures'));

module.exports = app;
