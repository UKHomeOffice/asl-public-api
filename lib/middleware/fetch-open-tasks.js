const { get, isFunction } = require('lodash');

module.exports = getId => (req, res, next) => {

  let id = get(res, 'response.id');

  if (isFunction(getId)) {
    id = getId(req, res);
  }

  if (!id) {
    return next();
  }

  return req.workflow.openTasks(id)
    .then(workflowResponse => {
      res.meta = res.meta || {};
      res.meta.openTasks = workflowResponse.json.data || [];
      next();
    })
    .catch(error => {
      req.log('error', { ...error, stack: error.stack, message: error.message });
      res.meta = res.meta || {};
      res.meta.openTasks = [{ action: 'failed' }];
      next();
    });
};
