const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

describe('/pils', () => {

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

  describe('/pil/:id', () => {

    it('returns 404 for unrecognised id', () => {
      return request(this.api)
        .get('/establishment/100/profile/f0835b01-00a0-4c7f-954c-13ed2ef7efd9/pil/notanid')
        .expect(404);
    });

    it('returns 404 for a different profiles pil id', () => {
      return request(this.api)
        .get('/establishment/100/profile/b2b8315b-82c0-4b2d-bc13-eb13e605ee88/pil/9fbe0218-995d-47d3-88e7-641fc046d7d1')
        .expect(404);
    });

    it('returns the data for an individual pil', () => {
      return request(this.api)
        .get('/establishment/100/profile/f0835b01-00a0-4c7f-954c-13ed2ef7efd9/pil/9fbe0218-995d-47d3-88e7-641fc046d7d1')
        .expect(200)
        .expect(pil => {
          assert.equal(pil.body.data.licence_number, 'AB-123');
        });
    });

  });

});
