const { get, isArray } = require('lodash');

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
    .then(workflowResponse => workflowResponse.json.data)
    .then(relatedTasks => {
      if (isArray(relatedTasks) && relatedTasks.length > 0) {
        const refusedTask = relatedTasks.find(task => task.status === 'refused');
        if (refusedTask) {
          req.project.refusedAt = refusedTask.updatedAt;
        }
      }
      next();
    });
};
