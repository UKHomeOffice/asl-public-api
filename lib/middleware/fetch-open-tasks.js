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
    .catch(next);
};
