const assert = require('assert');
const request = require('supertest');
const { stringify } = require('qs');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('/places', () => {
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

  it('returns only the places related to the current establishment', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/places`)
      .expect(200)
      .expect(response => {
        assert(response.body.data.length > 0);
        response.body.data.forEach(row => {
          assert.equal(row.establishmentId, ids.establishments.croydon);
        });
      });
  });

  it('does not include deleted places', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/places`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 2);
        response.body.data.forEach(row => {
          assert.notEqual(row.name, 'Deleted room');
        });
      });
  });

  it('includes the profiles of assigned NACWOs', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/places`)
      .expect(200)
      .expect(response => {
        const croydon101 = response.body.data.find(place => place.id === ids.places.croydon101);
        assert.equal(croydon101.nacwos.length, 1);
        assert.equal(croydon101.nacwos[0].profile.firstName, 'Clive');
        assert.equal(croydon101.nacwos[0].profile.lastName, 'Nacwo');
      });
  });

  it('filters by site', () => {
    const query = stringify({
      filters: {
        site: ['Lunar House']
      }
    });
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/places?${query}`)
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
      .get(`/establishment/${ids.establishments.croydon}/places?${query}`)
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
      .get(`/establishment/${ids.establishments.croydon}/places?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
      });
  });

  it('sends a message to Workflow on POST', () => {
    const input = {
      data: {
        site: 'Lunar House 3rd floor',
        name: '83',
        suitability: ['LA', 'DOG'],
        holding: ['NOH']
      }
    };
    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/places`)
      .send(input)
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'place');
        assert.equal(body.action, 'create');
        assert.deepEqual(body.data, { ...input.data, establishmentId: ids.establishments.croydon });
      });
  });

  it('can pass comments property without failing validation', () => {
    const input = {
      data: {
        site: 'Lunar House 3rd floor',
        name: '83',
        suitability: ['LA', 'DOG'],
        holding: ['NOH']
      },
      meta:
      {
        changesToRestrictions: 'changes',
        comments: 'comments'
      }
    };
    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/places`)
      .send(input)
      .expect(200);
  });

  it('returns 400 for invalid or missing data', () => {
    const input = {
      data: {
        site: 'Lunar House 3rd floor',
        // requires name
        suitability: ['LA', 'DOG'],
        holding: ['NOH']
      },
      meta:
      {
        changesToRestrictions: 'changes',
        comments: 'comments'
      }
    };
    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/places`)
      .send(input)
      .expect(400);
  });

  it('returns 400 for invalid role ids that don\'t exist at the establishment', () => {
    const invalidRoleId = '77748b0f-6725-44f5-a8f2-013014da4525';
    const input = {
      data: {
        site: 'Lunar House 3rd floor',
        name: '83',
        suitability: ['LA', 'DOG'],
        holding: ['NOH'],
        roles: [invalidRoleId]
      }
    };
    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/places`)
      .send(input)
      .expect(400);
  });

  describe('/place/:id', () => {

    it('returns 404 for unrecognised id', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/places/notanid`)
        .expect(404);
    });

    it('returns 404 for a different establishments place id', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/places/${ids.places.marvell101}`)
        .expect(404);
    });

    it('returns 400 for invalid or missing data', () => {
      const input = {
        data: {
          site: 'Lunar House 3rd floor',
          name: '83',
          suitability: ['FAKE'],
          holding: ['NOH']
        },
        meta: {
          changesToRestrictions: 'changes',
          comments: 'comments'
        }
      };
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/places/${ids.places.croydon101}`)
        .send(input)
        .expect(400);
    });

    it('returns 400 for invalid role ids that don\'t exist at the establishment', () => {
      const invalidRoleId = '77748b0f-6725-44f5-a8f2-013014da4525';
      const input = {
        data: {
          site: 'Lunar House',
          name: 'Room 101',
          suitability: ['SA', 'LA'],
          holding: ['LTH'],
          roles: [invalidRoleId]
        }
      };
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/places/${ids.places.croydon101}`)
        .send(input)
        .expect(400);
    });

    it('returns the profiles for associated roles', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/places/${ids.places.croydon101}`)
        .expect(200)
        .expect(response => {
          const croydon101 = response.body.data;
          assert.equal(croydon101.roles.length, 1);
          assert.equal(croydon101.roles[0].type, 'nacwo');
          assert.equal(croydon101.roles[0].profile.firstName, 'Clive');
          assert.equal(croydon101.roles[0].profile.lastName, 'Nacwo');
        });
    });

    it('adds a message to SQS on PUT', () => {
      const input = {
        data: {
          site: 'Lunar House 3rd floor',
          name: '83',
          suitability: ['LA', 'DOG'],
          holding: ['NOH']
        }
      };

      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/places/${ids.places.croydon101}`)
        .send(input)
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'place');
          assert.equal(body.action, 'update');
          assert.equal(body.id, ids.places.croydon101);
          assert.deepEqual(body.data, { ...input.data, establishmentId: ids.establishments.croydon });
        });
    });

    it('adds a message to SQS on DELETE', () => {
      const input = {
        meta: {
          comments: 'Lorem ipsum dolor'
        }
      };
      return request(this.api)
        .delete(`/establishment/${ids.establishments.croydon}/places/${ids.places.croydon101}`)
        .send(input)
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'place');
          assert.equal(body.action, 'delete');
          assert.equal(body.id, ids.places.croydon101);
        });
    });

  });

});
