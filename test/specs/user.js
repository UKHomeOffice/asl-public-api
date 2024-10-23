const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('/me', () => {
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

  describe('GET', () => {

    it('returns the logged in user', () => {
      return request(this.api)
        .get('/me')
        .expect(200)
        .expect(response => {
          assert.deepEqual(response.body.data.id, ids.profiles.linfordChristie);
        });
    });

    it('adds PIL review metadata to response', () => {
      return request(this.api)
        .get('/me')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.pil.reviewDate, '2029-01-01T12:00:00.000Z');
          assert.equal(response.body.data.pil.reviewDue, false);
          assert.equal(response.body.data.pil.reviewOverdue, false);
        });
    });

    it('does not include PIL review metadata for users with revoked PILs', () => {
      this.api.setUser({ id: 'hasRevokedPil' });
      return request(this.api)
        .get('/me')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.pil.reviewDate, '2021-01-01T12:00:00.000Z');
          assert.equal(response.body.data.pil.reviewDue, undefined);
          assert.equal(response.body.data.pil.reviewOverdue, undefined);
        });
    });

    it('includes a list of allowed actions', () => {
      const actions = {
        global: [],
        [ids.establishments.croydon]: ['establishment.read']
      };
      this.api.setUser({ allowedActions: () => Promise.resolve(actions) });
      return request(this.api)
        .get('/me')
        .expect(200)
        .expect(response => {
          assert.deepEqual(response.body.meta.allowedActions, actions);
        });
    });

    it('includes a list of open invitations for the user', () => {
      return request(this.api)
        .get('/me')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.invitations.length, 1);

          // match is case-insensitive but returned email has case preserved
          assert.equal(response.body.data.invitations[0].email, 'TEST1@example.com');

          assert.equal(response.body.data.invitations[0].establishment.name, 'Marvell Pharmaceuticals');
          assert.deepEqual(Object.keys(response.body.data.invitations[0].establishment), ['name']);
        });
    });

    describe('unverified user', () => {

      it('returns only basic data for users without verified email addresses', () => {
        this.api.setUser({ id: 'unverified' });
        return request(this.api)
          .get('/me')
          .expect(200)
          .expect(response => {
            assert.deepEqual(Object.keys(response.body.data), ['id', 'firstName', 'lastName', 'email'], 'only name and email fields should exist on the response data');
          });
      });

    });

  });

  it('posts to workflow on PUT', () => {
    const input = {
      firstName: 'Sterling'
    };

    return request(this.api)
      .put('/me')
      .send({ data: input })
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'profile');
        assert.equal(body.action, 'update');
        assert.deepEqual(body.data, input);
      });
  });

  it('throws a 400 error if sent invalid parameters', () => {
    const data = {
      asruUser: true,
      firstName: 'Sterling'
    };

    return request(this.api)
      .put('/me')
      .send({ data })
      .expect(400);
  });

  describe('email preferences', () => {

    it('does not throw a 404 if no preferences are defined', () => {
      return request(this.api)
        .get('/me/email-preferences')
        .expect(200);
    });

  });

  describe('changing email', () => {

    it('rejects if email is in use already', () => {
      const data = {
        email: 'test2@example.com'
      };

      return request(this.api)
        .put('/me/email')
        .send({ data })
        .expect(400);
    });

    it('rejects if email is in use already with different casing', () => {
      const data = {
        email: 'TEST2@example.com'
      };

      return request(this.api)
        .put('/me/email')
        .send({ data })
        .expect(400);
    });

  });

});
