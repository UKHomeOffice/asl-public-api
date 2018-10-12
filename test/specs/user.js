const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

const PROFILE_ID = 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9';

describe('/me', () => {
  beforeEach(() => {
    return apiHelper.create()
      .then(api => {
        this.api = api.api;
        this.workflow = api.workflow;
      });
  });

  afterEach(() => {
    return apiHelper.destroy();
  });

  it('returns the logged in user on GET', () => {
    return request(this.api)
      .get('/me')
      .expect(200)
      .expect(response => {
        assert.deepEqual(response.body.data.id, PROFILE_ID);
      });
  });

  it('posts to workflow on PUT', () => {
    const input = {
      firstName: 'Sterling'
    };

    return request(this.api)
      .put('/me')
      .send(input)
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'profile');
        assert.equal(body.action, 'update');
        assert.deepEqual(body.data, input);
      });
  });
});
