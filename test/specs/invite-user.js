const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

describe('Invite User', () => {
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

  it('sends a message to Workflow on POST', () => {
    const input = {
      firstName: 'Sterling',
      lastName: 'Archer',
      email: 'sterling@archer.com',
      role: 'admin'
    };
    return request(this.api)
      .post('/establishment/100/invite-user')
      .send({ data: input })
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'invitation');
        assert.equal(body.action, 'create');
        assert.deepEqual(body.data, { ...input, establishmentId: '100' });
      });
  });

  it('rejects with an error if Profile schema is invalid', () => {
    const input = {
      firstName: 'Sterling',
      lastName: 'Archer',
      role: 'admin'
    };
    return request(this.api)
      .post('/establishment/100/invite-user')
      .send({ data: input })
      .expect(400)
      .expect(response => {
        assert(
          JSON.parse(response.error.text).message
            .match(/email: is a required property/)
        );
      });
  });

  it('rejects with an error if Profile schema is invalid', () => {
    const input = {
      firstName: 'Sterling',
      lastName: 'Archer',
      email: 'sterling@archer.com'
    };
    return request(this.api)
      .post('/establishment/100/invite-user')
      .send({ data: input })
      .expect(400)
      .expect(response => {
        assert(
          JSON.parse(response.error.text).message
            .match(/role: is a required property/)
        );
      });
  });
});
