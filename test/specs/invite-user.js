const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

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
      .post(`/establishment/${ids.establishments.croydon}/invite-user`)
      .send({ data: input })
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'invitation');
        assert.equal(body.action, 'create');
        assert.deepEqual(body.data, { ...input, establishmentId: ids.establishments.croydon });
      });
  });

  it('rejects with an error if Profile schema is invalid', () => {
    const input = {
      firstName: 'Sterling',
      lastName: 'Archer',
      role: 'admin'
    };
    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/invite-user`)
      .send({ data: input })
      .expect(400)
      .expect(response => {
        assert(
          JSON.parse(response.error.text).message
            .match(/email: must have required property/)
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
      .post(`/establishment/${ids.establishments.croydon}/invite-user`)
      .send({ data: input })
      .expect(400)
      .expect(response => {
        assert(
          JSON.parse(response.error.text).message
            .match(/role: must have required property/)
        );
      });
  });

  it('rejects with an error if a profile with the same email already exists at the establishment', () => {
    const user = {
      firstName: 'Linford',
      lastName: 'Christie',
      email: 'TEST1@example.com',
      role: 'basic'
    };

    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/invite-user`)
      .send({ data: user })
      .expect(400)
      .expect(response => {
        assert(
          JSON.parse(response.error.text).message
            .match(/This user is already associated/)
        );
      });
  });

  it('rejects with an error if a profile with the same email already exists at the establishment (case-insensitive)', () => {
    const user = {
      firstName: 'Linford',
      lastName: 'Christie',
      email: 'TeSt1@ExAmPlE.cOm',
      role: 'basic'
    };

    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/invite-user`)
      .send({ data: user })
      .expect(400)
      .expect(response => {
        assert(
          JSON.parse(response.error.text).message
            .match(/This user is already associated/)
        );
      });
  });
});
