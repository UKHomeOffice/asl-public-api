const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

const ESTABSLISHMENT_ID = '100';
const PROFILE_ID = 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9';
const CERTIFICATE_ID = 'c3032cc0-7dc7-40bc-be7e-97edc4ea1072';

describe('Certificates', () => {
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

  it('sends a message to Workflow on POST', () => {
    const input = {
      modules: [
        {
          module: 'Module 1',
          species: [
            'rats',
            'mice'
          ]
        }
      ],
      passDate: '2018-01-01',
      accreditingBody: 'University of Croydon',
      otherAccreditingBody: null,
      certificateNumber: 'abc-123'
    };

    return request(this.api)
      .post(`/establishment/${ESTABSLISHMENT_ID}/profile/${PROFILE_ID}/certificate`)
      .send({ data: input })
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'certificate');
        assert.equal(body.action, 'create');
        assert.deepEqual(body.data, { ...input, profileId: PROFILE_ID });
      });
  });

  it('sends a message to workflow on DELETE', () => {
    return request(this.api)
      .delete(`/establishment/${ESTABSLISHMENT_ID}/profile/${PROFILE_ID}/certificate/${CERTIFICATE_ID}`)
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'certificate');
        assert.equal(body.action, 'delete');
        assert.equal(body.id, CERTIFICATE_ID);
      });
  });
});
