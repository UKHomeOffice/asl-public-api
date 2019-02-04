const { Router } = require('express');
const { pick } = require('lodash');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../../errors');
const router = Router({ mergeParams: true });

router.param('taskId', (req, res, next, taskId) => {
  if (!isUUID(taskId)) {
    throw new NotFoundError();
  }
  req.taskId = taskId;
  next();
});

router.get('/:taskId', (req, res, next) => {
  return req.workflow.task(req.taskId).read()
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

router.put('/:taskId/status', (req, res, next) => {
  return req.workflow.task(req.taskId).status({ status: req.body.status, meta: pick(req.body.meta, 'comment', 'restrictions') })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
});

router.get('/', (req, res, next) => {
  return req.workflow.list({ query: req.query })
    .then(response => {
      res.meta = response.json.meta;
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

module.exports = router;
