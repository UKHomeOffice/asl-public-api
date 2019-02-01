module.exports = (req, res, next) => {
  return req.workflow.openTasks(res.response.id)
    .then(workflowResponse => {
      res.response.openTasks = workflowResponse.json.data;
      next();
    })
    .catch(next);
};
