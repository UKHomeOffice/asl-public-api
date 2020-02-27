const { noop } = require('lodash');
const { UnauthorisedError } = require('../errors');

module.exports = (task, params = noop) => (req, res, next) => {
  if (req.permissionHoles && req.permissionHoles.includes(task)) {
    return next();
  }
  req.user.can(task, { ...req.params, ...params(req, res) })
    .then(can => can ? next() : next(new UnauthorisedError()))
    .catch(next);
};
