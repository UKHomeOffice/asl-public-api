const { BadRequestError } = require('@asl/service/errors');

module.exports = (...args) => (req, res, next) => {
  const fields = typeof args[0] === 'function'
    ? args[0](req)
    : args;

  const disallowed = Object.keys(req.body.data || {}).filter(key => !fields.includes(key));
  if (disallowed.length) {
    return next(new BadRequestError(`Invalid parameters: ${disallowed.join()}`));
  }
  next();
};
