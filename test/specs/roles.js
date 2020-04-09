const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('/roles', () => {
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

  it('returns NACWOs who do not have places assigned', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/roles?type=nacwo`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 2);
        assert.equal(response.body.data[0].type, 'nacwo');
        assert.equal(response.body.data[1].type, 'nacwo');
      });
  });

});
