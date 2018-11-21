const { Router } = require('express');
const router = Router({ mergeParams: true });

router.param('taskId', (req, res, next, taskId) => {
  return Promise.resolve()
    .then(() => {
      req.taskId = taskId;
      next();
    });
});

router.get('/:taskId', (req, res, next) => {
  const params = { action: 'read' };

  return req.workflow(params, `/${req.taskId}`)
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

router.put('/:taskId', (req, res, next) => {
  const params = {
    id: req.taskId,
    action: 'update',
    model: 'case',
    data: req.body
  };

  console.log(params);

  req.workflow(params, `/${req.taskId}/status`)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
});

router.get('/', (req, res, next) => {
  const { sort, limit, offset } = req.query;

  const params = {
    action: 'read',
    query: {
      data: {
        subject: req.user.profile.id
      },
      sort,
      limit,
      offset
    }
  };

  return req.workflow(params)
    .then((response) => {
      res.meta = response.json.meta;
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

module.exports = router;
