const { BadRequestError } = require('../errors');

module.exports = (...fields) => (req, res, next) => {
  const disallowed = Object.keys(req.body.data || {}).filter(key => !fields.includes(key));
  if (disallowed.length) {
    return next(new BadRequestError(`Invalid parameters: ${disallowed.join()}`));
  }
  next();
};
