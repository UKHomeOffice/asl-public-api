const { UnauthorisedError } = require('../errors');

module.exports = task => (req, res, next) => {
  req.user.can(task, req.params)
    .then(can => can ? next() : next(new UnauthorisedError()))
    .catch(next);
};
