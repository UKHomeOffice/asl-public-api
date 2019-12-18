module.exports = () => {

  return (error, req, res, next) => {
    error.status = error.status || 500;
    if (typeof req.log === 'function' && error.status > 499) {
      req.log('error', { ...error, stack: error.stack, message: error.message });
    }
    if (req.method === 'GET' && error.status === 403) {
      res.status(404);
      return res.json({ message: 'Not found' });
    }
    res.status(error.status);
    res.json({ message: error.message });
  };

};
