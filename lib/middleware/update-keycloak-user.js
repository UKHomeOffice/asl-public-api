module.exports = () => (req, res, next) => {
  const { authToken, email } = req.body;

  const user = {
    id: req.user.id,
    email
  };

  return Promise.resolve()
    .then(() => req.user.updateKeycloak(authToken, user))
    .then(() => next())
    .catch(next);
};
