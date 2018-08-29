module.exports = (Model, data) => (req, res, next) => {
  const err = Model.validate(data);

  return err ? next(err) : next();
};
