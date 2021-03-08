const { Router } = require('express');
const { permissions, whitelist } = require('../../middleware');

const submit = action => (req, res, next) => {
  const params = {
    model: 'procedure',
    action,
    meta: req.body.meta
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create({
            ...params,
            data: req.body.data.map(v => ({ ...v, ropId: req.rop.id }))
          });
        case 'update':
          return req.workflow.update({ ...params, id: req.procedure.id, data: req.body.data });
        case 'delete':
          return req.workflow.delete({ ...params, id: req.procedure.id });
      }
    })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

const app = Router({ mergeParams: true });

app.param('procedureId', (req, res, next, procedureId) => {
  const { Procedure } = req.models;

  return Promise.resolve()
    .then(() => Procedure.query().findById(procedureId))
    .then(procedure => {
      req.procedure = procedure;
      next();
    })
    .catch(next);
});

app.get('/', permissions('project.update'), (req, res, next) => {
  const { Procedure } = req.models;
  const { sort, limit, offset } = req.query;
  const ropId = req.rop.id;

  return Promise.all([
    Procedure.count(ropId),
    Procedure.list({ ropId, limit, offset, sort })
  ])
    .then(([total, procs]) => {
      res.meta.total = total;
      res.meta.count = procs.total;
      res.response = procs.results;
      next();
    })
    .catch(next);

});

app.post('/',
  permissions('project.update'),
  submit('create')
);

app.get('/:procedureId', permissions('project.update'), (req, res, next) => {
  res.response = req.procedure;
  next();
});

app.put('/:procedureId',
  permissions('project.update'),
  whitelist(req => req.models.Procedure.editableFields),
  submit('update')
);

app.delete('/:procedureId', permissions('project.update'), submit('delete'));

module.exports = app;
