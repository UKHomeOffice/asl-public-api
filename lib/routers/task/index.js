const { Router } = require('express');
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
  return req.workflow.read(req)
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

router.put('/:taskId', (req, res, next) => {
  return req.workflow.update({ taskId: req.taskId, data: req.body })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
});

router.get('/', (req, res, next) => {
  return req.workflow.list(req, {
    data: { subject: req.user.profile.id }
  })
    .then(response => {
      res.meta = response.json.meta;
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

module.exports = router;
