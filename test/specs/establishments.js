const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

const NOT_AUTHORISED = new Error('Not authorised');
NOT_AUTHORISED.status = 403;

describe('/establishments', () => {
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

  it('returns a list of all establishments', () => {
    return request(this.api)
      .get('/establishments')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 2);
      });
  });

  it('returns a 403 id user does not have permission to view all establishments', () => {
    this.api.setUser({ can: () => Promise.reject(NOT_AUTHORISED) });
    return request(this.api)
      .get('/establishments')
      .expect(403);
  });

  describe('/establishment/:establishment', () => {

    it('returns a 404 error for unknown establishment id', () => {
      return request(this.api)
        .get('/establishment/99999')
        .expect(404);
    });

    it('returns the establishment details when provided a valid id', () => {
      return request(this.api)
        .get('/establishment/100')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.name, 'University of Croydon');
        });
    });

    it('includes the details fo the licence holder as `pelh`', () => {
      return request(this.api)
        .get('/establishment/100')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.pelh.name, 'Colin Jackson');
        });
    });

    it('returns the users establishment', () => {
      this.api.setUser({ establishment: '100' });
      return request(this.api)
        .get('/establishment/100')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.name, 'University of Croydon');
        });
    });

    it('returns a 403 if the user is not authorised', () => {
      this.api.setUser({ can: () => Promise.reject(NOT_AUTHORISED) });
      return request(this.api)
        .get('/establishment/100')
        .expect(403);
    });

  });

});
