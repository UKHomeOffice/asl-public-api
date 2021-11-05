const moment = require('moment');
const assert = require('assert');
const request = require('supertest');
const sinon = require('sinon');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

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
        .post(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.hasNoPil}/pil`)
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
            establishmentId: ids.establishments.croydon,
            profileId: ids.profiles.hasNoPil
          });
        });
    });

    it('throws a 400 error if extra parameters are sent', () => {
      const input = {
        status: 'active'
      };
      return request(this.api)
        .post(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.hasNoPil}/pil`)
        .send({ data: input })
        .expect(400);
    });
  });

  describe('GET /pils', () => {
    it('returns a list of all active pils at the establishment', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/pils`)
        .expect(200)
        .then(response => {
          const meta = response.body.meta;
          assert.equal(meta.total, 4);
          assert.equal(meta.count, 4);
        });
    });

    it('can search pils by licence holder name', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/pils?search=Linford`)
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
        .get(`/establishment/${ids.establishments.croydon}/pils?search=Clive`)
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
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/pil/notanid`)
        .expect(404);
    });

    it('returns 404 for a different profiles pil id', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.noddyHolder}/pil/${ids.pils.linfordChristie}`)
        .expect(404);
    });

    it('returns the data for an individual pil', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}`)
        .expect(200)
        .expect(pil => {
          assert.equal(pil.body.data.licenceNumber, 'AB-123');
        });
    });

    it('defaults the reviewDate to the last updated date + 5 years if it is not present', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}`)
        .expect(200)
        .expect(pil => {
          assert.equal(pil.body.data.reviewDate, '2025-01-01T12:00:00.000Z');
        });
    });

    it('uses the reviewDate from the model if it is present', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.multipleEstablishments}/pil/${ids.pils.multipleEstablishments}`)
        .expect(200)
        .expect(pil => {
          assert.equal(pil.body.data.reviewDate, '2024-12-01T12:00:00.000Z');
        });
    });

    it('sets reviewDue and reviewOverdue properties on the pil if a review is not due', () => {
      const { PIL } = this.api.app.db;
      const reviewDate = moment().add(6, 'months').toISOString();
      return Promise.resolve()
        .then(() => PIL.query().findById(ids.pils.linfordChristie).patch({ reviewDate }))
        .then(() => {
          return request(this.api)
            .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}`)
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
        .then(() => PIL.query().findById(ids.pils.linfordChristie).patch({ reviewDate }))
        .then(() => {
          return request(this.api)
            .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}`)
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
        .then(() => PIL.query().findById(ids.pils.linfordChristie).patch({ reviewDate }))
        .then(() => {
          return request(this.api)
            .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}`)
            .expect(200)
            .expect(pil => {
              assert.equal(pil.body.data.reviewDue, true);
              assert.equal(pil.body.data.reviewOverdue, true);
            });
        });
    });

    it('does not attach review metadata to revoked pils', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.hasRevokedPil}/pil`)
        .expect(200)
        .then(response => {
          const data = response.body.data;
          assert.equal(data.reviewDue, undefined);
          assert.equal(data.reviewOverdue, undefined);
        });
    });

    describe('establishmentName permissions', () => {
      it('includes the establishment if the requesting user has permissions for the holding establishment', () => {
        const can = sinon.stub().resolves(true);
        can.withArgs('establishment.read', { establishment: ids.establishments.croydon }).resolves(true);
        this.api.setUser({ can });
        return request(this.api)
          .get(`/establishment/${ids.establishments.marvell}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}`)
          .expect(200)
          .expect(pil => {
            assert.ok(pil.body.data.establishment);
          });
      });

      it('does not include the establishment if the requesting user doesn\'t have permissions for the holding establishment', () => {
        const can = sinon.stub().resolves(true);
        can.withArgs('establishment.read', { establishment: ids.establishments.croydon }).resolves(false);
        this.api.setUser({ can });
        return request(this.api)
          .get(`/establishment/${ids.establishments.marvell}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}`)
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
          .put(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}/grant`)
          .send({ data: input })
          .expect(200)
          .expect(() => {
            assert.equal(this.workflow.handler.callCount, 1);
            const req = this.workflow.handler.firstCall.args[0];
            const body = req.body;
            assert.equal(req.method, 'POST');
            assert.equal(body.model, 'pil');
            assert.equal(body.action, 'grant');
            assert.equal(body.id, ids.pils.linfordChristie);
            assert.deepEqual(body.data, {
              ...input,
              establishmentId: ids.establishments.croydon,
              profileId: ids.profiles.linfordChristie,
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
          .put(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}/pil/${ids.pils.linfordChristie}/grant`)
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
            from: { id: ids.establishments.croydon, name: 'University of Croydon' },
            to: { id: ids.inactiveEstablishment, name: 'Invisible Pharma' }
          }
        };

        return request(this.api)
          .put(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.multipleEstablishments}/pil/${ids.pils.multipleEstablishments}/transfer`)
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
            from: { id: ids.establishments.croydon, name: 'University of Croydon' },
            to: { id: ids.establishments.marvell, name: 'Marvell Pharmaceutical' }
          }
        };

        return request(this.api)
          .put(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.multipleEstablishments}/pil/${ids.pils.multipleEstablishments}/transfer`)
          .send({ data: input })
          .expect(200)
          .expect(() => {
            assert.equal(this.workflow.handler.callCount, 1);
            const req = this.workflow.handler.firstCall.args[0];
            const body = req.body;

            assert.equal(req.method, 'POST');
            assert.equal(body.model, 'pil');
            assert.equal(body.action, 'transfer');
            assert.equal(body.changedBy, ids.profiles.multipleEstablishments);
            assert.equal(body.id, ids.pils.multipleEstablishments);
            assert.deepEqual(body.data, {
              ...input,
              establishmentId: ids.establishments.marvell,
              profileId: ids.profiles.multipleEstablishments
            });
          });
      });

      it('can be initiated by an ASRU user', () => {
        this.api.setUser({ id: 'licensing' });

        const input = {
          procedures: ['C'],
          species: ['Mice', 'Rats'],
          establishment: {
            from: { id: ids.establishments.croydon, name: 'University of Croydon' },
            to: { id: ids.establishments.marvell, name: 'Marvell Pharmaceutical' }
          }
        };

        return request(this.api)
          .put(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.multipleEstablishments}/pil/${ids.pils.multipleEstablishments}/transfer`)
          .send({ data: input })
          .expect(200)
          .expect(() => {
            assert.equal(this.workflow.handler.callCount, 1);
            const req = this.workflow.handler.firstCall.args[0];
            const body = req.body;

            assert.equal(req.method, 'POST');
            assert.equal(body.model, 'pil');
            assert.equal(body.action, 'transfer');
            assert.equal(body.changedBy, ids.profiles.licensing);
            assert.equal(body.id, ids.pils.multipleEstablishments);
            assert.deepEqual(body.data, {
              ...input,
              establishmentId: ids.establishments.marvell,
              profileId: ids.profiles.multipleEstablishments
            });
          });
      });
    });

  });

});
