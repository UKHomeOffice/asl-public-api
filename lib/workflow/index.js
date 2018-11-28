const Workflow = require('./client');

module.exports = settings => (req, res, next) => {
  req.workflow = new Workflow(settings.workflow, req.user.access_token);
  next();
};
