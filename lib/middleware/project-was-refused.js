const { get } = require('lodash');

module.exports = (req, res, next) => {
  let id = get(req, 'project.id');

  if (!id) {
    return next();
  }

  return req.workflow.related({ query: {
    model: 'project',
    modelId: id,
    onlyOpen: false,
    establishmentId: req.establishment.id
  }})
    .then(workflowResponse => {
      const relatedTasks = workflowResponse.json.data;
      const refusedTask = relatedTasks.find(task => task.status === 'refused');
      if (refusedTask) {
        req.project.refusedAt = refusedTask.updatedAt;
      }
      next();
    });
};
