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
      console.log('workflow response: ', response);
      res.response = response.json.data;
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
