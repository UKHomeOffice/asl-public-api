const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('Rops', () => {
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

  describe('POST', () => {
    it('sends a message to Workflow on POST, setting year to 2021', () => {
      return request(this.api)
        .post(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeProject}/rops`)
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'rop');
          assert.equal(body.action, 'create');
          assert.deepEqual(body.data, { projectId: ids.projects.croydon.activeProject, year: 2021 });
        });
    });

    it('throws an error if a draft rop already exists', () => {
      return request(this.api)
        .post(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rops`)
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/A rop already exists for 2021/)
          );
        });
    });
  });

  describe('PUT', () => {
    it('throws an error if rop is not inactive', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rops/${ids.rops.submitted}`)
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/Cannot update once submitted/)
          );
        });
    });

    it('throws an error if disallowed field is changed', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rops/${ids.rops.draft}`)
        .send({ data: { year: 2022 } })
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/Invalid parameters: year/)
          );
        });
    });

    it('can update allowed fields', () => {
      const params = {
        data: {
          species: {
            precoded: ['mice', 'rats']
          }
        }
      };
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rops/${ids.rops.draft}`)
        .send(params)
        .expect(200)
        .expect(response => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'rop');
          assert.equal(body.action, 'update');
          assert.deepEqual(body.data.species, params.data.species);
        });
    });
  });

  describe('GET', () => {
    it('can get a ROP by ID', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rops/${ids.rops.draft}`)
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.id, ids.rops.draft);
        });
    });
  });
});
