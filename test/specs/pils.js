const moment = require('moment');
const assert = require('assert');
const request = require('supertest');
const sinon = require('sinon');
const apiHelper = require('../helpers/api');

const PROFILE_1 = 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9';
const PROFILE_2 = 'b2b8315b-82c0-4b2d-bc13-eb13e605ee88';
const PROFILE_3 = 'ae28fb31-d867-4371-9b4f-79019e71232f';
const LICENSING_ID = 'a942ffc7-e7ca-4d76-a001-0b5048a057d2';

const PIL_1 = '9fbe0218-995d-47d3-88e7-641fc046d7d1';
const PIL_2 = '117298fa-f98f-4a98-992d-d29b60703866';

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

  describe('GET /pils', () => {
    it('returns a list of all active pils at the establishment', () => {
      return request(this.api)
        .get('/establishment/100/pils')
        .expect(200)
        .then(response => {
          const meta = response.body.meta;
          assert.equal(meta.total, 4);
          assert.equal(meta.count, 4);
        });
    });

    it('can search pils by licence holder name', () => {
      return request(this.api)
        .get('/establishment/100/pils?search=Linford')
        .expect(200)
        .then(response => {
          const { data, meta } = response.body;
          assert.equal(meta.total, 4);
          assert.equal(meta.count, 1);
          assert.equal(data[0].profile.name, 'Linford Christie');
        });
    });

    it('assigns reviewDue and reviewOverdue properties', () => {
      return request(this.api)
        .get('/establishment/100/pils?search=Clive')
        .expect(200)
        .then(response => {
          const data = response.body.data;
          assert.equal(data[0].reviewDue, true);
          assert.equal(data[0].reviewOverdue, true);
        });
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

    it('defaults the reviewDate to the last updated date + 5 years if it is not present', () => {
      return request(this.api)
        .get(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}`)
        .expect(200)
        .expect(pil => {
          assert.equal(pil.body.data.reviewDate, '2025-01-01T12:00:00.000Z');
        });
    });

    it('uses the reviewDate from the model if it is present', () => {
      return request(this.api)
        .get(`/establishment/100/profile/${PROFILE_3}/pil/${PIL_2}`)
        .expect(200)
        .expect(pil => {
          assert.equal(pil.body.data.reviewDate, '2024-12-01T12:00:00.000Z');
        });
    });

    it('sets reviewDue and reviewOverdue properties on the pil if a review is not due', () => {
      const { PIL } = this.api.app.db;
      const reviewDate = moment().add(6, 'months').toISOString();
      return Promise.resolve()
        .then(() => PIL.query().findById(PIL_1).patch({ reviewDate }))
        .then(() => {
          return request(this.api)
            .get(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}`)
            .expect(200)
            .expect(pil => {
              assert.equal(pil.body.data.reviewDue, false);
              assert.equal(pil.body.data.reviewOverdue, false);
            });
        });
    });

    it('sets reviewDue and reviewOverdue properties on the pil if a review is due', () => {
      const { PIL } = this.api.app.db;
      const reviewDate = moment().add(2, 'months').toISOString();
      return Promise.resolve()
        .then(() => PIL.query().findById(PIL_1).patch({ reviewDate }))
        .then(() => {
          return request(this.api)
            .get(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}`)
            .expect(200)
            .expect(pil => {
              assert.equal(pil.body.data.reviewDue, true);
              assert.equal(pil.body.data.reviewOverdue, false);
            });
        });
    });

    it('sets reviewDue and reviewOverdue properties on the pil if a review is overdue', () => {
      const { PIL } = this.api.app.db;
      const reviewDate = moment().subtract(1, 'month').toISOString();
      return Promise.resolve()
        .then(() => PIL.query().findById(PIL_1).patch({ reviewDate }))
        .then(() => {
          return request(this.api)
            .get(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}`)
            .expect(200)
            .expect(pil => {
              assert.equal(pil.body.data.reviewDue, true);
              assert.equal(pil.body.data.reviewOverdue, true);
            });
        });
    });

    describe('establishmentName permissions', () => {
      it('includes the establishment if the requesting user has permissions for the holding establishment', () => {
        const can = sinon.stub().resolves(true);
        can.withArgs('establishment.read', { establishment: 100 }).resolves(true);
        this.api.setUser({ can });
        return request(this.api)
          .get(`/establishment/101/profile/${PROFILE_1}/pil/${PIL_1}`)
          .expect(200)
          .expect(pil => {
            assert.ok(pil.body.data.establishment);
          });
      });

      it('does not include the establishment if the requesting user doesn\'t have permissions for the holding establishment', () => {
        const can = sinon.stub().resolves(true);
        can.withArgs('establishment.read', { establishment: 100 }).resolves(false);
        this.api.setUser({ can });
        return request(this.api)
          .get(`/establishment/101/profile/${PROFILE_1}/pil/${PIL_1}`)
          .expect(200)
          .expect(pil => {
            assert.equal(pil.body.data.establishment, undefined);
          });
      });
    });

    describe('grant', () => {
      it('sends a message to workflow on PUT', () => {
        const input = {
          procedures: ['C']
        };
        return request(this.api)
          .put(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}/grant`)
          .send({ data: input })
          .expect(200)
          .expect(() => {
            assert.equal(this.workflow.handler.callCount, 1);
            const req = this.workflow.handler.firstCall.args[0];
            const body = req.body;
            assert.equal(req.method, 'POST');
            assert.equal(body.model, 'pil');
            assert.equal(body.action, 'grant');
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
          .put(`/establishment/100/profile/${PROFILE_1}/pil/${PIL_1}/grant`)
          .send({ data: input })
          .expect(400);
      });
    });

    describe('transfer', () => {
      beforeEach(() => {
        this.api.setUser({ id: 'multi-establishment' }); // Colin is linked with Croydon and Marvell Pharma
      });

      it('throws a 400 error if a transfer is attempted to an establishment the profile does not have visibility of', () => {
        const input = {
          procedures: ['C'],
          species: ['Mice', 'Rats'],
          establishment: {
            from: { id: 100, name: 'University of Croydon' },
            to: { id: 999, name: 'Invisible Pharma' }
          }
        };

        return request(this.api)
          .put(`/establishment/100/profile/${PROFILE_3}/pil/${PIL_2}/transfer`)
          .send({ data: input })
          .expect(400)
          .expect(response => {
            assert.equal(response.body.message, 'Can only transfer a PIL to establishments the user is associated with');
          });
      });

      it('passes the legit transfer request to workflow', () => {
        const input = {
          procedures: ['C'],
          species: ['Mice', 'Rats'],
          establishment: {
            from: { id: 100, name: 'University of Croydon' },
            to: { id: 101, name: 'Marvell Pharmaceutical' }
          }
        };

        return request(this.api)
          .put(`/establishment/100/profile/${PROFILE_3}/pil/${PIL_2}/transfer`)
          .send({ data: input })
          .expect(200)
          .expect(() => {
            assert.equal(this.workflow.handler.callCount, 1);
            const req = this.workflow.handler.firstCall.args[0];
            const body = req.body;

            assert.equal(req.method, 'POST');
            assert.equal(body.model, 'pil');
            assert.equal(body.action, 'transfer');
            assert.equal(body.changedBy, PROFILE_3);
            assert.equal(body.id, PIL_2);
            assert.deepEqual(body.data, {
              ...input,
              establishmentId: '101',
              profileId: PROFILE_3
            });
          });
      });

      it('can be initiated by an ASRU user', () => {
        this.api.setUser({ id: 'licensing' });

        const input = {
          procedures: ['C'],
          species: ['Mice', 'Rats'],
          establishment: {
            from: { id: 100, name: 'University of Croydon' },
            to: { id: 101, name: 'Marvell Pharmaceutical' }
          }
        };

        return request(this.api)
          .put(`/establishment/100/profile/${PROFILE_3}/pil/${PIL_2}/transfer`)
          .send({ data: input })
          .expect(200)
          .expect(() => {
            assert.equal(this.workflow.handler.callCount, 1);
            const req = this.workflow.handler.firstCall.args[0];
            const body = req.body;

            assert.equal(req.method, 'POST');
            assert.equal(body.model, 'pil');
            assert.equal(body.action, 'transfer');
            assert.equal(body.changedBy, LICENSING_ID);
            assert.equal(body.id, PIL_2);
            assert.deepEqual(body.data, {
              ...input,
              establishmentId: '101',
              profileId: PROFILE_3
            });
          });
      });
    });

  });

});
