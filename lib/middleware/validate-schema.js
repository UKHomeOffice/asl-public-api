module.exports = (Model, data) => async (req, res, next) => {
  if (typeof Model === 'string') {
    Model = req.models[Model];
  }
  if (!data) {
    data = {
      ...req.body.data,
      establishmentId: req.establishment.id
    };
  }
  const err = await Model.validate(data);

  return err ? next(err) : next();
};
