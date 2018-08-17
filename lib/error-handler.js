const ValidationError = require('objection/lib/model/ValidationError');

module.exports = () => {

  return (error, req, res, next) => {
    error.status = error.status || 500;
    if (error instanceof ValidationError) {
      error.status = 400;
    }
    if (typeof req.log === 'function' && error.status > 499) {
      req.log('error', error);
    }
    res.status(error.status);
    res.json({ message: error.message });
  };

};
