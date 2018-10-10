const ApiClient = require('@asl/service/lib/api');

const validate = require('./validate');

module.exports = settings => {

  return (req, res, next) => {

    const headers = {
      Authorization: `bearer ${req.user.access_token}`,
      'Content-type': 'application/json'
    };
    const submit = ApiClient(settings.workflow, { headers, method: 'POST' });

    req.workflow = data => {
      return Promise.resolve()
        .then(() => {
          return validate(data);
        })
        .then(() => {
          return submit('/', { body: JSON.stringify({ ...data, changedBy: req.profile.id }) });
        });
    };

    next();
  };

};
