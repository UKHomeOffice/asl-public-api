const assert = require('assert');
const request = require('supertest');
const uuid = require('uuid/v4');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('/establishment/:id/invitations', () => {
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

  describe('DELETE /:invitationId', () => {

    it('sends a delete message to workflow', () => {
      return request(this.api)
        .delete(`/establishment/${ids.establishments.marvell}/invitations/${ids.invitations.basic}`)
        .expect(200)
        .expect(response => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          assert.equal(req.body.model, 'invitation');
          assert.equal(req.body.id, ids.invitations.basic);
          assert.equal(req.body.action, 'delete');
        });
    });

    it('returns a 404 for an invalid uuid', () => {
      return request(this.api)
        .delete(`/establishment/${ids.establishments.marvell}/invitations/123`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

    it('returns a 404 if no invitation is found', () => {
      return request(this.api)
        .delete(`/establishment/${ids.establishments.marvell}/invitations/${uuid()}`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

    it('returns a 404 if invitation is held at another establishment', () => {
      return request(this.api)
        .delete(`/establishment/${ids.establishments.croydon}/invitations/${ids.invitations.basic}`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

  });

  describe('PUT /:invitationId/cancel', () => {

    it('sends a cancel message to workflow', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.marvell}/invitations/${ids.invitations.basic}/cancel`)
        .expect(200)
        .expect(response => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          assert.equal(req.body.model, 'invitation');
          assert.equal(req.body.id, ids.invitations.basic);
          assert.equal(req.body.action, 'cancel');
        });
    });

    it('returns a 404 for an invalid uuid', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.marvell}/invitations/123/cancel`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

    it('returns a 404 if no invitation is found', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.marvell}/invitations/${uuid()}/cancel`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

    it('returns a 404 if invitation is held at another establishment', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/invitations/${ids.invitations.basic}/cancel`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

  });

  describe('PUT /:invitationId/resend', () => {

    it('sends a resend message to workflow', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.marvell}/invitations/${ids.invitations.basic}/resend`)
        .expect(200)
        .expect(response => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          assert.equal(req.body.model, 'invitation');
          assert.equal(req.body.id, ids.invitations.basic);
          assert.equal(req.body.action, 'resend');
        });
    });

    it('returns a 404 for an invalid uuid', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.marvell}/invitations/123/resend`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

    it('returns a 404 if no invitation is found', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.marvell}/invitations/${uuid()}/resend`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

    it('returns a 404 if invitation is held at another establishment', () => {
      return request(this.api)
        .put(`/establishment/${ids.establishments.croydon}/invitations/${ids.invitations.basic}/resend`)
        .expect(404)
        .expect(response => {
          assert.equal(response.body.message, 'Not found');
          assert.equal(this.workflow.handler.callCount, 0);
        });
    });

  });

});

describe('/invitation', () => {
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

  beforeEach(() => {
    // reset user for each test
    this.api.setUser();
  });

  it('returns a 404 if no invitation is found', () => {
    return request(this.api)
      .get('/invitation/not-a-token')
      .expect(404)
      .expect(response => {
        assert.equal(response.body.message, 'Not found');
      });
  });

});
