const assert = require('assert');
const request = require('supertest');
const moment = require('moment');
const apiHelper = require('../helpers/api');

const INACTIVE_PROJECT_ID = 'bf22f7cd-cf85-42ef-93da-02b709df67be';
const ACTIVE_PROJECT_ID = 'd2f9777d-2d9d-4ea2-a9c2-c5ed592fd98d';
const TRANSFER_PROJECT_ID = '0a1c24e7-60dd-4882-8b07-31176e5657e4';
const LICENCE_HOLDER_ID = 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9';
const ASRU_AMENDMENT_PROJECT_ID = 'db6cf8e1-7a1f-41c0-96f7-ef1a4dadcaa8';

describe('/projects', () => {
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

  it('returns only the current establishments projects when searching - bugfix', () => {
    return request(this.api)
      .get('/establishment/100/projects?search=abc&status=inactive') // "abc" matches licence number for all projects
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1, 'Returns exactly one project');
        assert.equal(response.body.data[0].title, 'Draft project');
      });
  });

  describe('PUT /:id/revoke', () => {
    it('prevents the revocation of non-active projects', () => {
      return request(this.api)
        .put(`/establishment/100/projects/${INACTIVE_PROJECT_ID}/revoke`)
        .send({ meta: { comments: 'testing revocation of inactive project' } })
        .expect(400)
        .expect(response => {
          assert(
            JSON.parse(response.error.text).message
              .match(/only active projects can be revoked/)
          );
        });
    });

    it('can revoke active projects', () => {
      return request(this.api)
        .put(`/establishment/100/projects/${ACTIVE_PROJECT_ID}/revoke`)
        .send({ meta: { comments: 'testing revocation of active project' } })
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'project');
          assert.equal(body.action, 'revoke');
          assert.equal(body.id, ACTIVE_PROJECT_ID);
          assert.equal(body.establishmentId, 100);
          assert.deepEqual(body.data, { establishmentId: 100, licenceHolderId: LICENCE_HOLDER_ID });
        });
    });
  });

  describe('POST /:id/transfer', () => {
    beforeEach(() => {
      this.api.setUser({ id: 'nacwo' });
    });

    it('throws an error if the licence holder doesn\'t have permissions at the incoming establishment', () => {
      const payload = {
        data: {
          establishmentId: 999
        }
      };
      return request(this.api)
        .post(`/establishment/100/projects/${TRANSFER_PROJECT_ID}/transfer`)
        .send(payload)
        .expect(400)
        .then(response => response.body)
        .then(error => {
          assert.equal(error.message, 'User is not associated with Invisible Pharma');
        });
    });

    it('throws an error if the outgoing establishment is unknown', () => {
      const payload = {
        data: {
          establishmentId: 500
        }
      };
      return request(this.api)
        .post(`/establishment/100/projects/${TRANSFER_PROJECT_ID}/transfer`)
        .send(payload)
        .expect(404)
        .then(response => response.body)
        .then(error => {
          assert.equal(error.message, 'Not found');
        });
    });

    it('throws an error if the outgoing and incoming establishments are the same', () => {
      const payload = {
        data: {
          establishmentId: 100
        }
      };
      return request(this.api)
        .post(`/establishment/100/projects/${TRANSFER_PROJECT_ID}/transfer`)
        .send(payload)
        .expect(400)
        .then(response => response.body)
        .then(error => {
          assert.equal(error.message, 'Cannot transfer licence to the same establishment');
        });
    });

    it('creates a new transfer task', () => {
      const payload = {
        data: {
          establishmentId: 101
        }
      };
      return request(this.api)
        .post(`/establishment/100/projects/${TRANSFER_PROJECT_ID}/transfer`)
        .send(payload)
        .expect(200)
        .then(() => {
          // calls openTasks and create
          assert.equal(this.workflow.handler.callCount, 2);
          const req = this.workflow.handler.secondCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'project');
          assert.equal(body.action, 'transfer');
          assert.equal(body.id, TRANSFER_PROJECT_ID);
        });
    });

  });

  describe('DELETE /:id/draft-amendments', () => {
    it('throws an error if called by an establishment user and draft version is asruVersion', () => {
      return request(this.api)
        .delete(`/establishment/100/projects/${ASRU_AMENDMENT_PROJECT_ID}/draft-amendments`)
        .expect(400)
        .expect(response => {
          assert.equal(JSON.parse(response.error.text).message, 'Cannot delete amendment as initiated by ASRU');
        });
    });

    it('calls workflow if user can delete amendment', () => {
      this.api.setUser({ id: 'licensing' });
      return request(this.api)
        .delete(`/establishment/100/projects/${ASRU_AMENDMENT_PROJECT_ID}/draft-amendments`)
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'project');
          assert.equal(body.action, 'delete-amendments');
          assert.equal(body.id, ASRU_AMENDMENT_PROJECT_ID);
        });
    });
  });

  describe('GET /:id', () => {

    it('does not include RA date on draft projects', () => {
      return request(this.api)
        .get('/establishment/101/projects/ba3f4fdf-27e4-461e-a251-333333333333')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.raDate, undefined);
        });
    });

    it('does not include RA date on projects without RA', () => {
      return request(this.api)
        .get('/establishment/101/projects/ba3f4fdf-27e4-461e-a251-444444444444')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.raDate, undefined);
        });
    });

    it('includes RA date on granted projects with RA condition', () => {
      return request(this.api)
        .get('/establishment/101/projects/ba3f4fdf-27e4-461e-a251-555555555555')
        .expect(200)
        .expect(response => {
          assert.equal(moment(response.body.data.raDate).format('YYYY-MM-DD'), '2025-07-01');
        });
    });

    it('calculates RA date from revocation date on revoked projects', () => {
      return request(this.api)
        .get('/establishment/101/projects/ba3f4fdf-27e4-461e-a251-666666666666')
        .expect(200)
        .expect(response => {
          assert.equal(moment(response.body.data.raDate).format('YYYY-MM-DD'), '2024-07-01');
        });
    });

  });

});
