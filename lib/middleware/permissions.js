const { noop } = require('lodash');
const { UnauthorisedError } = require('../errors');

module.exports = (task, params = noop) => (req, res, next) => {
  req.user.can(task, { ...req.params, ...params(req, res) })
    .then(can => can ? next() : next(new UnauthorisedError()))
    .catch(next);
};
