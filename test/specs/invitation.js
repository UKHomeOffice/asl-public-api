const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

describe('/invitation', () => {
  before(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.workflow = api.workflow;
      });
  });

  after(() => {
    return apiHelper.destroy();
  });

  beforeEach(() => {
    // reset user for each test
    this.api.setUser();
  });

  it('returns a 404 if no invitation is found', () => {
    return request(this.api)
      .get('/invitation/not-a-token')
      .expect(404)
      .expect(response => {
        assert.equal(response.body.message, 'Not found');
      });
  });

});
