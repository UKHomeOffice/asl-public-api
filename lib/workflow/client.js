const { get, pick } = require('lodash');
const ApiClient = require('@asl/service/lib/api');
const { MissingParamError } = require('../errors');

class Workflow {
  constructor(settings, accessToken) {
    const headers = {
      Authorization: `bearer ${accessToken}`,
      'Content-type': 'application/json'
    };
    this.client = ApiClient(settings, { headers });
  }

  validate(data, ...params) {
    params.forEach(param => {
      if (!data[param]) {
        throw new MissingParamError(param);
      }
    });
  }

  _pack(req, { data = {}, ...params }) {
    return JSON.stringify({
      data: {
        ...(req.body.data || req.body || {}),
        ...data
      },
      meta: req.body.meta,
      changedBy: get(req.user, 'profile.id'),
      ...params
    });
  }

  create(req, params) {
    this.validate(params, 'model');
    const { data, model } = params;
    return this.client('/', {
      method: 'POST',
      body: this._pack(req, {
        action: 'create',
        data,
        model
      })
    });
  }

  update(req, params) {
    this.validate(params, 'id', 'model');
    const { data, model, id, action = 'update' } = params;
    return this.client('/', {
      method: 'POST',
      body: this._pack(req, {
        data,
        model,
        id,
        action
      })
    });
  }

  delete(req, params) {
    this.validate(params, 'id', 'model');
    const { id, model } = params;
    return this.client('/', {
      method: 'POST',
      body: this._pack(req, {
        id,
        model,
        action: 'delete'
      })
    });
  }

  read(req) {
    return this.client(`/${req.taskId}`);
  }

  list(req, { data }) {
    return this.client('/', {
      query: pick(req.query, 'limit', 'offset', 'sort'),
      data
    });
  }

  status(req, params) {
    this.validate(params, 'status');
    const { status } = this.params;
    return this.client(`/${req.taskId}/status`, { method: 'PUT', status });
  }
}

module.exports = Workflow;
