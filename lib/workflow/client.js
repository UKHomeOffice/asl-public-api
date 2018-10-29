const ApiClient = require('@asl/service/lib/api');
const validate = require('./validate');

module.exports = settings => {

  return (req, res, next) => {
    const headers = {
      Authorization: `bearer ${req.user.access_token}`,
      'Content-type': 'application/json'
    };

    const client = ApiClient(settings.workflow, { headers });

    req.workflow = params => {
      if (params.action === 'read') {
        console.log('attempting to read from workflow cases');
        return client('/', { method: 'GET', query: params.query });
      }

      return Promise.resolve()
        .then(() => {
          return validate(params);
        })
        .then(() => {
          return client('/', {
            method: 'POST',
            body: JSON.stringify({ ...params, changedBy: req.user.profile.id })
          });
        });
    };

    next();
  };

};
