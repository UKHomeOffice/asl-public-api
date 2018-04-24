module.exports = () => {

  return (error, req, res, next) => {
    if (typeof req.log === 'function') {
      req.log('error', error);
    }
    res.status(error.status || 500);
    res.json({ message: error.message });
  };

};
