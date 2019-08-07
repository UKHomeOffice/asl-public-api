const { get } = require('lodash');

module.exports = (req, res, next) => {
  if (!get(res, 'response.id')) {
    return next();
  }

  return req.workflow.openTasks(res.response.id)
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
