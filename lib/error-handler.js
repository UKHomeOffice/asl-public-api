module.exports = () => {

  return (error, req, res, next) => {
    error.status = error.status || 500;
    if (typeof req.log === 'function' && error.status > 499) {
      req.log('error', { ...error, stack: error.stack, message: error.message });
    }
    res.status(error.status);
    res.json({ message: error.message });
  };

};
