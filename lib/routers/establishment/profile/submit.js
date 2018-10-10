module.exports = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'profile',
      data: { ...req.body },
      id: res.profile && res.profile.id
    };

    if (req.establishment) {
      params.data.establishmentId = req.establishment.id;
    }

    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};
