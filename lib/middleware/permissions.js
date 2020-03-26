const { noop, some, castArray, without } = require('lodash');
const { UnauthorisedError } = require('../errors');

module.exports = (tasks, params = noop) => (req, res, next) => {
  tasks = castArray(tasks);
  if (req.permissionHoles && !without(tasks, ...req.permissionHoles).length) {
    return next();
  }
  Promise.all(
    tasks.map(task => req.user.can(task, { ...req.params, ...params(req, res) }))
  )
    .then(cans => some(cans) ? next() : next(new UnauthorisedError()))
    .catch(next);
};
