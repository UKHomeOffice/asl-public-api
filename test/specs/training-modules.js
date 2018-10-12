const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

const TRAINING_ID = 'c3032cc0-7dc7-40bc-be7e-97edc4ea1072';

describe('Training Modules', () => {
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
      notApplicable: false,
      accreditingBody: 'University of Croydon',
      otherAccreditingBody: null,
      certificateNumber: 'abc-123',
      exemption: false,
      exemptionDescription: null
    };

    return request(this.api)
      .post('/me/training')
      .send(input)
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'trainingModule');
        assert.equal(body.action, 'create');
        assert.deepEqual(body.data, input);
      });
  });

  it('sends a message to workflow on DELETE', () => {
    return request(this.api)
      .delete(`/me/training/${TRAINING_ID}`)
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'trainingModule');
        assert.equal(body.action, 'delete');
        assert.equal(body.id, TRAINING_ID);
      });
  });
});
