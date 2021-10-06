
module.exports = () => (req, res, next) => {
  if (!req.establishment || !req.profileId) {
    return next();
  }

  return req.workflow.profileTasks(req.profileId, req.establishment.id)
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
