const { get } = require('lodash');
const ApiClient = require('@asl/service/lib/api');
const validate = require('./validate');

module.exports = settings => {

  return (req, res, next) => {
    const headers = {
      Authorization: `bearer ${req.user.access_token}`,
      'Content-type': 'application/json'
    };

    const client = ApiClient(settings.workflow, { headers });

    req.workflow = (params, path = '/') => {
      if (params.action === 'read') {
        return client(path, { method: 'GET', query: params.query });
      }

      if (params.model === 'case' && params.action === 'update') {
        return Promise.resolve()
          .then(() => {
            return validate(params);
          })
          .then(() => {
            return client(path, {
              method: 'PUT',
              body: JSON.stringify(params.data)
            });
          });
      }

      return Promise.resolve()
        .then(() => {
          return validate(params);
        })
        .then(() => {
          return client(path, {
            method: 'POST',
            body: JSON.stringify({ ...params, changedBy: get(req.user, 'profile.id') })
          });
        });
    };

    next();
  };

};
