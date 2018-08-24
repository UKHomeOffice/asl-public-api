const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

describe('/roles', () => {
  before(() => {
    return apiHelper.create()
      .then(() => {
        this.api = apiHelper.api;
      });
  });

  after(() => {
    return apiHelper.destroy();
  });

  it('returns NACWOs who do not have places assigned', () => {
    return request(this.api)
      .get('/establishment/100/roles?type=nacwo')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 2);
        assert.equal(response.body.data[0].type, 'nacwo');
        assert.equal(response.body.data[1].type, 'nacwo');
      });
  });

});
