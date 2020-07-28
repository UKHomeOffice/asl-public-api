module.exports = () => (req, res, next) => {
  const { taskId, status } = req.body;
  if (taskId && status === 'updated') {
    return Promise.resolve()
      .then(() => req.workflow.task(req.body.taskId).status({ status: 'updated', meta: req.body.meta, data: req.body.data }))
      .then(response => {
        res.response = response.json.data;
      })
      .then(() => next('router'))
      .catch(next);
  }
  next();
};
