const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

describe('/projects', () => {
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

  it('maps cameCase species fields to hyphen-separated - bugfix', () => {
    return request(this.api)
      .get('/establishment/101/project/ba3f4fdf-27e4-461e-a251-333333333333/project-version/ba3f4fdf-27e4-461e-a251-444444444444')
      .expect(200)
      .expect(response => {
        const protocols = response.body.data.data.protocols;

        assert.equal(protocols[0].species[0]['genetically-altered'], true, 'Should preserve `genetically-altered` value');
        assert.equal(protocols[0].species[0]['life-stages'], 'Adult', 'Should map `lifeStage` value to `life-stages`');
        assert.equal(protocols[0].species[0].lifeStage, undefined, 'Should remove `lifeStage` value');

        assert.equal(protocols[0].species[1]['genetically-altered'], false, 'Should preserve `genetically-altered` value');
        assert.equal(protocols[0].species[1].geneticallyAltered, undefined, 'Should remove `geneticallyAltered` value');
        assert.equal(protocols[0].species[1]['life-stages'], 'Adult', 'Should map `lifeStage` value to `life-stages`');
        assert.equal(protocols[0].species[1].lifeStage, undefined, 'Should remove `lifeStage` value');

        assert.equal(protocols[1].species[0]['genetically-altered'], true, 'Should map `geneticallyAltered` value to `genetically-altered`');
        assert.equal(protocols[1].species[0].geneticallyAltered, undefined, 'Should remove `geneticallyAltered` value');
        assert.equal(protocols[1].species[0]['life-stages'], 'Embryo', 'Should preserve `life-stages` value');
        assert.equal(protocols[1].species[0].lifeStage, undefined, 'Should remove `lifeStage` value');
      });
  });

  it('does not map any fields on schema version 1 licences - bugfix', () => {
    return request(this.api)
      .get('/establishment/101/project/ba3f4fdf-27e4-461e-a251-111111111111/project-version/ba3f4fdf-27e4-461e-a251-222222222222')
      .expect(200)
      .expect(response => {
        const protocols = response.body.data.data.protocols;

        assert.equal(protocols[0].species[0].geneticallyAltered, true, 'Should preserve `geneticallyAltered` value');

      });
  });

});
