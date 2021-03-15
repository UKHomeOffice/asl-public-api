const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('Procedures', () => {
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
    it('throws an error if rop already submitted', () => {
      const params = {
        data: {
          species: 'mice',
          ga: 'no-ga',
          purposes: 'basic',
          newGeneticLine: false,
          severity: 'severe',
          severityNum: 123
        }
      };
      return request(this.api)
        .post(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.submitted}/procedures`)
        .send(params)
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/Cannot add procedures to submitted rop/)
          );
        });
    });

    it('throws an error if invalid params sent', () => {
      const params = {
        data: [
          {
            species: 'mice',
            foo: 'bar'
          },
          {
            a: 'b'
          }
        ]
      };
      return request(this.api)
        .post(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.draft}/procedures`)
        .send(params)
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/Invalid parameters: foo,a/)
          );
        });
    });

    it('throws an error if required fields missing', () => {
      const params = {
        data: {
          species: 'mice'
        }
      };
      return request(this.api)
        .post(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.draft}/procedures`)
        .send(params)
        .expect(400)
        .expect(response => {
          [
            'ga',
            'purposes',
            'newGeneticLine',
            'severity',
            'severityNum'
          ].forEach(field => {
            const re = new RegExp(`${field}: is a required property`);
            assert(JSON.parse(response.error.text).message.match(re));
          });
        });
    });

    it('accepts a single proc model', () => {
      const params = {
        data: {
          species: 'mice',
          ga: 'no-ga',
          purposes: 'basic',
          newGeneticLine: false,
          severity: 'severe',
          severityNum: 123
        }
      };
      return request(this.api)
        .post(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.draft}/procedures`)
        .send(params)
        .expect(200)
        .expect(response => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'procedure');
          assert.equal(body.action, 'create');
          assert.deepEqual(body.data, [
            {
              ...params.data,
              ropId: ids.rops.draft
            }
          ]);
        });
    });

    it('accepts an array of proc model', () => {
      const params = {
        data: [
          {
            species: 'mice',
            ga: 'no-ga',
            purposes: 'basic',
            newGeneticLine: false,
            severity: 'severe',
            severityNum: 123
          },
          {
            species: 'mice',
            ga: 'no-ga',
            purposes: 'basic',
            newGeneticLine: false,
            severity: 'non',
            severityNum: 50
          }
        ]
      };
      return request(this.api)
        .post(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.draft}/procedures`)
        .send(params)
        .expect(200)
        .expect(response => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'procedure');
          assert.equal(body.action, 'create');
          assert.deepEqual(body.data, params.data.map(d => ({ ...d, ropId: ids.rops.draft })));
        });
    });
  });

  describe('PUT', () => {
    it('can update a single procedure', () => {
      const params = {
        data: {
          species: 'rats'
        }
      };
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.draft}/procedures/${ids.procedures.draft}`)
        .send(params)
        .expect(200)
        .expect(response => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'procedure');
          assert.equal(body.action, 'update');
          assert.deepEqual(body.data, params.data);
        });
    });

    it('cannot update a procedure for a submitted rop', () => {
      const params = {
        data: {
          species: 'rats'
        }
      };
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.submitted}/procedures/${ids.procedures.submitted}`)
        .send(params)
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/Cannot add procedures to submitted rop/)
          );
        });
    });

    it('doesnt accept superfluous params', () => {
      const params = {
        data: {
          foo: 'bar'
        }
      };
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.draft}/procedures/${ids.procedures.draft}`)
        .send(params)
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/Invalid parameters: foo/)
          );
        });
    });
  });

  describe('DELETE', () => {
    it('cannot delete a proc from a submitted rop', () => {
      return request(this.api)
        .delete(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.submitted}/procedures/${ids.procedures.submitted}`)
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/Cannot add procedures to submitted rop/)
          );
        });
    });

    it('can delete a proc from a draft rop', () => {
      return request(this.api)
        .delete(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.activeAA}/rop/${ids.rops.draft}/procedures/${ids.procedures.draft}`)
        .expect(200)
        .expect(response => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'procedure');
          assert.equal(body.action, 'delete');
          assert.equal(body.id, ids.procedures.draft);
        });
    });
  });
});
