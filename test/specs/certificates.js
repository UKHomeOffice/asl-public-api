const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

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
      modules: ['L'],
      species: ['rats', 'mice'],
      passDate: '2018-01-01',
      accreditingBody: 'University of Croydon',
      otherAccreditingBody: null,
      certificateNumber: 'abc-123'
    };

    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/certificate`)
      .send({ data: input })
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'certificate');
        assert.equal(body.action, 'create');
        assert.deepEqual(body.data, { ...input, profileId: ids.profiles.linfordChristie });
      });
  });

  it('sends a message to workflow on DELETE', () => {
    return request(this.api)
      .delete(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/certificate/${ids.certificates.linfordChristie}`)
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'certificate');
        assert.equal(body.action, 'delete');
        assert.equal(body.id, ids.certificates.linfordChristie);
      });
  });
});
