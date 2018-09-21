const { omit } = require('lodash');
const { validateSchema } = require('../../middleware');

module.exports = () => {
  return (req, res, next) => {
    const ignoredFields = ['comments'];
    return validateSchema(req.models.Profile, {
      ...(res.profile || {}),
      ...omit(req.body, ignoredFields)
    })(req, res, next);
  };
};
