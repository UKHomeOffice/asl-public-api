const { get, isFunction } = require('lodash');

module.exports = id => (req, res, next) => {
  if (!id && !get(res, 'response.id')) {
    return next();
  }

  if (isFunction(id)) {
    id = id(req, res);
  }

  return req.workflow.openTasks(id || res.response.id)
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
