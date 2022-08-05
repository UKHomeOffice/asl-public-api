const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

const NOT_AUTHORISED = new Error('Not authorised');
NOT_AUTHORISED.status = 403;

describe('/establishments', () => {
  beforeEach(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.workflow = api.workflow;
      });
  });

  afterEach(() => {
    return apiHelper.destroy();
  });

  it('returns a list of all establishments', () => {
    return request(this.api)
      .get('/establishments')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 5);
      });
  });

  it('returns a 404 if user does not have permission to view all establishments', () => {
    this.api.setUser({ can: () => Promise.reject(NOT_AUTHORISED) });
    return request(this.api)
      .get('/establishments')
      .expect(404);
  });

  describe('/establishment/:establishment', () => {

    it('returns a 404 error for invalid establishment id', () => {
      return request(this.api)
        .get('/establishment/undefined')
        .expect(404);
    });

    it('returns a 404 error for unknown establishment id', () => {
      return request(this.api)
        .get('/establishment/99999')
        .expect(404);
    });

    it('returns the establishment details when provided a valid id', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}`)
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.name, 'University of Croydon');
        });
    });

    it('includes a count of the places at the establishment', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}`)
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.placesCount, 3);
        });
    });

    it('returns the users establishment', () => {
      this.api.setUser({ establishment: ids.establishments.croydon });
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}`)
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.name, 'University of Croydon');
        });
    });

    it('returns a 404 if the user is not authorised', () => {
      this.api.setUser({ can: () => Promise.reject(NOT_AUTHORISED) });
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}`)
        .expect(404);
    });

    describe('grant', () => {
      it('sends a message to workflow on PUT', () => {
        const meta = {
          comments: 'Hey there'
        };

        return request(this.api)
          .put(`/establishment/${ids.establishments.inactiveEstablishment}/grant`)
          .send({ data: {}, meta })
          .expect(200)
          .expect(() => {
            assert.equal(this.workflow.handler.callCount, 1);
            const req = this.workflow.handler.firstCall.args[0];
            const body = req.body;
            assert.equal(req.method, 'POST');
            assert.equal(body.model, 'establishment');
            assert.equal(body.action, 'grant');
            assert.equal(body.id, ids.establishments.inactiveEstablishment);
            assert.deepEqual(body.meta, meta);
          });
      });
    });

  });

});
