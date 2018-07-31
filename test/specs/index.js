const assert = require('assert');
const request = require('supertest');

const Database = require('../helpers/db');
const WithUser = require('../helpers/with-user');
const Workflow = require('../helpers/workflow');
const Api = require('../../lib/api');
const data = require('../data');

const settings = {
  database: process.env.POSTGRES_DB || 'asl-test',
  username: process.env.POSTGRES_USER,
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
          sqs: {},
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
          assert.equal(response.body.data.pelh.name, 'Noddy Holder');
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
        return request(this.api)
          .get('/establishment/100/places?site=Lunar%20House')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 2);
          });
      });

      it('filters by suitability', () => {
        return request(this.api)
          .get('/establishment/100/places?filters%5Bsuitability%5D%5B0%5D=LA')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('filters by holding', () => {
        return request(this.api)
          .get('/establishment/100/places?filters%5Bholding%5D%5B0%5D=LTH')
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

        it('does not return 404 for a deleted room', () => {
          return request(this.api)
            .get('/establishment/100/places/a50331bb-c1d0-4068-87ca-b5a41143b0d0')
            .expect(200);
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
            assert.equal(response.body.data.length, 3);
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
            assert.equal(response.body.data.length, 3);
            response.body.data.forEach(profile => {
              assert.equal(typeof profile.name, 'string');
            });
          });
      });

      it('can search on full name', () => {
        return request(this.api)
          .get('/establishment/100/profiles?search=Linford+Christie')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('can search on full name', () => {
        return request(this.api)
          .get('/establishment/100/profiles?search=Linford+Christina')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 0);
          });
      });

      it('can search on a single name', () => {
        return request(this.api)
          .get('/establishment/100/profiles?search=Linford')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('can search on a single name', () => {
        return request(this.api)
          .get('/establishment/100/profiles?search=Linfordia')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 0);
          });
      });

      it('can search on a role type', () => {
        return request(this.api)
          .get('/establishment/100/profiles?filters%5Broles%5D%5B0%5D=nacwo')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
          });
      });

      it('can search on a role type and name', () => {
        return request(this.api)
          .get('/establishment/100/profiles?filters%5Broles%5D%5B0%5D=pelh&search=noddy')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 1);
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
            assert.equal(response.body.data.length, 1);
            assert.equal(response.body.data[0].type, 'nacwo');
          });
      });

    });

  });

});
