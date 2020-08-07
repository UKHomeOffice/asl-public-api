const { Router } = require('express');
const { pick } = require('lodash');
const isUUID = require('uuid-validate');
const { NotFoundError } = require('../../errors');
const router = Router({ mergeParams: true });

router.get('/related', (req, res, next) => {
  return req.workflow.related({ query: req.query })
    .then(response => {
      res.response = response.json.data;
      res.meta = response.json.meta;
      // don't fall through to the routes below as they will capture 'related' as ':taskId'
      return next('router');
    })
    .catch(next);
});

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
  return req.workflow.task(req.taskId).status({
    status: req.body.status,
    meta: pick(req.body.meta, 'comment', 'restrictions', 'awerb', 'awerb-review-date', 'awerb-no-review-reason')
  })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

router.post('/:taskId/comment', (req, res, next) => {
  return req.workflow.task(req.taskId).comment({ comment: req.body.comment, meta: req.body.meta })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
});

router.put('/:taskId/comment/:commentId', (req, res, next) => {
  return req.workflow.task(req.taskId).updateComment({ id: req.params.commentId, comment: req.body.comment, meta: req.body.meta })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

router.delete('/:taskId/comment/:commentId', (req, res, next) => {
  return req.workflow.task(req.taskId).deleteComment({ id: req.params.commentId })
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
