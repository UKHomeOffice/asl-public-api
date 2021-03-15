const { BadRequestError } = require('@asl/service/errors');
const { flatten } = require('lodash');

module.exports = (...args) => (req, res, next) => {
  const fields = typeof args[0] === 'function'
    ? args[0](req)
    : args;

  const data = Array.isArray(req.body.data) ? req.body.data : [req.body.data];

  const disallowed = data.reduce((arr, row) => {
    return flatten([
      ...arr,
      Object.keys(row || {}).filter(key => !fields.includes(key))
    ]);
  }, []);

  if (disallowed.length) {
    return next(new BadRequestError(`Invalid parameters: ${disallowed.join()}`));
  }
  next();
};
