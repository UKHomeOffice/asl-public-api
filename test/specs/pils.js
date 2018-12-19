const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

const PROFILE_1 = 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9';
const PROFILE_2 = 'b2b8315b-82c0-4b2d-bc13-eb13e605ee88';

const PIL_1 = '9fbe0218-995d-47d3-88e7-641fc046d7d1';

describe('/pils', () => {

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

  describe('/pil', () => {
    it('sends a message to workflow on POST', () => {
      return request(this.api)
        .post(`/establishment/100/profile/${PROFILE_1}/pil`)
        .send({ data: {} })
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'pil');
          assert.equal(body.action, 'create');
          assert.deepEqual(body.data, {
            establishmentId: '100',
            profileId: PROFILE_1
          });
        });
    });

    it('throws a 400 error if extra parameters are sent', () => {
      const input = {
        status: 'active'
      };
      return request(this.api)
        .post(`/establishment/100/profile/${PROFILE_1}/pil`)
        .send({ data: input })
        .expect(400);
    });
  });

  describe('/pil/:id', () => {

    it('returns 404 for unrecognised id', () => {
      return request(this.api)
        .get(`/establishment/100/profile/${PROFILE_1}/pil/notanid`)
        .expect(404);
    });

    it('returns 404 for a different profiles pil id', () => {
      return request(this.api)
        .get(`/establishment/100/profile/${PROFILE_2}/pil/${PIL_1}`)
        .expect(404);
    });

    it('returns the data for an individual pil', () => {
      return request(this.api)
        .get(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}`)
        .expect(200)
        .expect(pil => {
          assert.equal(pil.body.data.licenceNumber, 'AB-123');
        });
    });

    it('sends a message to workflow on PUT', () => {
      const input = {
        procedures: ['C']
      };
      return request(this.api)
        .put(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}`)
        .send({ data: input })
        .expect(200)
        .expect(() => {
          assert.equal(this.workflow.handler.callCount, 1);
          const req = this.workflow.handler.firstCall.args[0];
          const body = req.body;
          assert.equal(req.method, 'POST');
          assert.equal(body.model, 'pil');
          assert.equal(body.action, 'update');
          assert.equal(body.id, PIL_1);
          assert.deepEqual(body.data, {
            ...input,
            establishmentId: '100',
            profileId: PROFILE_1,
            procedures: ['C']
          });
        });
    });

    it('throws a 400 error if extra parameters are sent', () => {
      const input = {
        procedures: ['C'],
        status: 'active'
      };
      return request(this.api)
        .put(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}`)
        .send({ data: input })
        .expect(400);
    });

  });

});
