const assert = require('assert');
const request = require('supertest');
const moment = require('moment');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

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
      // "abc" matches licence number for all projects
      .get(`/establishment/${ids.establishments.croydon}/projects?search=abc&status=inactive`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1, 'Returns exactly one project');
        assert.equal(response.body.data[0].title, 'Draft project');
      });
  });

  describe('PUT /:id/revoke', () => {
    it('prevents the revocation of non-active projects', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.draftProject}/revoke`)
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
        .put(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.activeProject}/revoke`)
        .send({ meta: { comments: 'testing revocation of active project' } })
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'project');
          assert.equal(body.action, 'revoke');
          assert.equal(body.id, ids.projects.croydon.activeProject);
          assert.equal(body.establishmentId, ids.establishments.croydon);
          assert.deepEqual(body.data, { establishmentId: ids.establishments.croydon, licenceHolderId: ids.profiles.linfordChristie });
        });
    });
  });

  describe('DELETE /:id/draft-amendments', () => {
    it('throws an error if called by an establishment user and draft version is asruVersion', () => {
      return request(this.api)
        .delete(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.asruInitiatedAmendment}/draft-amendments`)
        .expect(400)
        .expect(response => {
          assert.equal(JSON.parse(response.error.text).message, 'Cannot delete amendment as initiated by ASRU');
        });
    });

    it('calls workflow if user can delete amendment', () => {
      this.api.setUser({ id: 'licensing' });
      return request(this.api)
        .delete(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.asruInitiatedAmendment}/draft-amendments`)
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'project');
          assert.equal(body.action, 'delete-amendments');
          assert.equal(body.id, ids.projects.croydon.asruInitiatedAmendment);
        });
    });
  });

  describe('GET /:id', () => {

    it('does not include RA date on draft projects', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.marvell}/projects/${ids.projects.marvell.testLegacyProject}`)
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.raDate, undefined);
        });
    });

    it('does not include RA date on projects without RA', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.marvell}/projects/${ids.projects.marvell.nonRaProject}`)
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.raDate, undefined);
        });
    });

    it('includes RA date on granted projects with RA condition', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.marvell}/projects/${ids.projects.marvell.raProject}`)
        .expect(200)
        .expect(response => {
          assert.equal(moment(response.body.data.raDate).format('YYYY-MM-DD'), '2025-07-01');
        });
    });

    it('calculates RA date from revocation date on revoked projects', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.marvell}/projects/${ids.projects.marvell.revokedRaProject}`)
        .expect(200)
        .expect(response => {
          assert.equal(moment(response.body.data.raDate).format('YYYY-MM-DD'), '2024-07-01');
        });
    });

  });

});
