module.exports = () => {

  return (error, req, res, next) => {
    console.error(error);
    res.status(error.status || 500);
    res.json({ message: error.message });
  };

};
