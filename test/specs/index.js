const assert = require('assert');
const request = require('supertest');
const { stringify } = require('qs');
const redis = require('redis');

const Database = require('../helpers/db');
const WithUser = require('../helpers/with-user');
const Workflow = require('../helpers/workflow');
const Api = require('../../lib/api');
const data = require('../data');

const settings = {
  database: process.env.POSTGRES_DB || 'asl-test',
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST || 'localhost'
};

const NOT_AUTHORISED = new Error('Not authorised');
NOT_AUTHORISED.status = 403;

describe('API', () => {

  beforeEach(() => {
    return Database(settings).init(data.default)
      .then(() => Workflow())
      .then(workflow => {
        this.workflow = workflow;
        const api = Api({
          auth: false,
          log: { level: 'error' },
          db: settings,
          workflow: workflow.url
        });
        this.api = WithUser(api, {});
      });
  });

  afterEach(() => {
    return this.workflow.teardown()
      .then(() => {
        return this.api && this.api.app.db.destroy();
      });
  });

  describe('rate limiting', () => {

    beforeEach(() => {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost'
      });
      this.client.del('ratelimit:/establishments:get:user.id:abc123');
      const api = Api({
        auth: false,
        log: { level: 'error' },
        db: settings,
        redis: {
          host: process.env.REDIS_HOST || 'localhost'
        },
        limiter: { total: 1 }
      });
      this.rateLimitedApi = WithUser(api, {});
    });

    afterEach(() => {
      this.client.end(true);
      return this.rateLimitedApi && this.rateLimitedApi.app.db.destroy();
    });

    it('will reject the second request made by a user', () => {
      return request(this.rateLimitedApi)
        .get('/establishments')
        .expect(200)
        .then(() => {
          return request(this.rateLimitedApi)
            .get('/establishments')
            .expect(429);
        });
    });
    it('will not reject requests to a users profile - /me', () => {
      return request(this.rateLimitedApi)
        .get('/me')
        .expect(200)
        .then(() => {
          return request(this.rateLimitedApi)
            .get('/me')
            .expect(200);
        });
    });
  });

  describe('/establishments', () => {

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

  });

  describe('/establishment/:establishment', () => {

    it('returns a 404 error for unknown establishment id', () => {
      return request(this.api)
        .get('/establishment/nope')
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

    describe('/places', () => {

      it('returns only the places related to the current establishment', () => {
        return request(this.api)
          .get('/establishment/100/places')
          .expect(200)
          .expect(response => {
            assert(response.body.data.length > 0);
            response.body.data.forEach(row => {
              assert.equal(row.establishmentId, 100);
            });
          });
      });

      it('does not include deleted places', () => {
        return request(this.api)
          .get('/establishment/100/places')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 2);
            response.body.data.forEach(row => {
              assert.notEqual(row.name, 'Deleted room');
            });
          });
      });

      it('filters by site', () => {
        const query = stringify({
          filters: {
            site: ['Lunar House']
          }
        });
        return request(this.api)
          .get(`/establishment/100/places?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 2);
          });
      });

      it('filters by suitability', () => {
        const query = stringify({
          filters: {
            suitability: ['LA']
          }
        });
        return request(this.api)
          .get(`/establishment/100/places?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('filters by holding', () => {
        const query = stringify({
          filters: {
            holding: ['LTH']
          }
        });
        return request(this.api)
          .get(`/establishment/100/places?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('sends a message to Workflow on POST', () => {
        const input = {
          comments: 'Lorem ipsum dolor'
        };
        return request(this.api)
          .post('/establishment/100/places')
          .send(input)
          .expect(200)
          .expect(() => {
            assert.equal(this.workflow.handler.callCount, 1);
            const req = this.workflow.handler.firstCall.args[0];
            const body = req.body;
            assert.equal(req.method, 'POST');
            assert.equal(body.model, 'place');
            assert.equal(body.action, 'create');
            assert.deepEqual(body.data, { ...input, establishment: '100' });
          });
      });

      describe('/place/:id', () => {

        it('returns 404 for unrecognised id', () => {
          return request(this.api)
            .get('/establishment/100/places/notanid')
            .expect(404);
        });

        it('returns 404 for a different establishments place id', () => {
          return request(this.api)
            .get('/establishment/100/places/e859d43a-e8ab-4ae6-844a-95c978082a48')
            .expect(404);
        });

        it('adds a message to SQS on PUT', () => {
          const input = {
            comments: 'Lorem ipsum dolor'
          };
          return request(this.api)
            .put('/establishment/100/places/1d6c5bb4-be60-40fd-97a8-b29ffaa2135f')
            .send(input)
            .expect(200)
            .expect(() => {
              assert.equal(this.workflow.handler.callCount, 1);
              const req = this.workflow.handler.firstCall.args[0];
              const body = req.body;
              assert.equal(req.method, 'POST');
              assert.equal(body.model, 'place');
              assert.equal(body.action, 'update');
              assert.equal(body.id, '1d6c5bb4-be60-40fd-97a8-b29ffaa2135f');
              assert.deepEqual(body.data, { ...input, establishment: '100' });
            });
        });

        it('adds a message to SQS on DELETE', () => {
          const input = {
            comments: 'Lorem ipsum dolor'
          };
          return request(this.api)
            .delete('/establishment/100/places/1d6c5bb4-be60-40fd-97a8-b29ffaa2135f')
            .send(input)
            .expect(200)
            .expect(() => {
              assert.equal(this.workflow.handler.callCount, 1);
              const req = this.workflow.handler.firstCall.args[0];
              const body = req.body;
              assert.equal(req.method, 'POST');
              assert.equal(body.model, 'place');
              assert.equal(body.action, 'delete');
              assert.equal(body.id, '1d6c5bb4-be60-40fd-97a8-b29ffaa2135f');
              assert.deepEqual(body.data, { ...input, establishment: '100' });
            });
        });

      });

    });

    describe('/profiles', () => {

      it('returns only the profiles related to the current establishment', () => {
        return request(this.api)
          .get('/establishment/100/profiles')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 5);
            response.body.data.forEach(profile => {
              profile.establishments.forEach(establishment => {
                assert.equal(establishment.id, 100);
              });
            });
          });
      });

      it('returns a list that includes the `name` virtual property', () => {
        return request(this.api)
          .get('/establishment/100/profiles')
          .expect(200)
          .expect(response => {
            assert(response.body.data.length > 0);
            response.body.data.forEach(profile => {
              assert.equal(typeof profile.name, 'string');
            });
          });
      });

      it('can filter on a role type', () => {
        const query = stringify({
          filters: {
            roles: ['nacwo']
          }
        });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 2);
            response.body.data.forEach(profile => {
              assert.equal(profile.roles.length, 1);
              assert.equal(profile.roles[0].type, 'nacwo');
            });
          });
      });

      it('can search on full name', () => {
        const query = stringify({ search: 'Linford Christie' });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('can search on full name', () => {
        const query = stringify({ search: 'Linford Christina' });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 0);
          });
      });

      it('can search on firstName', () => {
        const query = stringify({ search: 'Linford' });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('can search on firstName', () => {
        const query = stringify({ search: 'Linfordia' });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 0);
          });
      });

      it('can search on lastName', () => {
        const query = stringify({ search: 'Christie' });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('can search on lastName', () => {
        const query = stringify({ search: 'Christina' });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 0);
          });
      });

      it('can filter on a role type and search name', () => {
        const query = stringify({
          filters: {
            roles: ['pelh']
          },
          search: 'colin'
        });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
            assert.equal(response.body.data[0].name, 'Colin Jackson');
          });
      });

      it('returns only the ELH for the requested establishment', () => {
        const query = stringify({
          filters: {
            roles: ['pelh']
          }
        });
        return request(this.api)
          .get(`/establishment/100/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
            assert.equal(response.body.data[0].roles.length, 1);
          });
      });

      it('returns only the PELH for the requested establishment', () => {
        const query = stringify({
          filters: {
            roles: ['pelh']
          }
        });
        return request(this.api)
          .get(`/establishment/101/profiles?${query}`)
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
            assert.equal(response.body.data[0].roles.length, 1);
          });
      });

      describe('/profile/:id', () => {

        it('returns the profile data for an individual profile', () => {
          return request(this.api)
            .get('/establishment/100/profile/f0835b01-00a0-4c7f-954c-13ed2ef7efd9')
            .expect(200)
            .expect(profile => {
              assert.equal(profile.body.data.name, 'Linford Christie');
            });
        });

        it('includes the PIL data if it exists', () => {
          return request(this.api)
            .get('/establishment/100/profile/f0835b01-00a0-4c7f-954c-13ed2ef7efd9')
            .expect(200)
            .expect(profile => {
              assert.equal(profile.body.data.pil.licenceNumber, 'ABC123');
            });
        });

        it('returns a NACWO role for NACWOs without places', () => {
          return request(this.api)
            .get('/establishment/100/profile/a942ffc7-e7ca-4d76-a001-0b5048a057d9')
            .expect(200)
            .expect(profile => {
              assert.deepEqual(profile.body.data.roles.map(r => r.type), ['nacwo']);
            });
        });

      });

    });

    describe('/roles', () => {

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

  });

});
