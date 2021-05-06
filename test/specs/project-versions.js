const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

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

  it('checks that version id and project id correspond', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.marvell}/project/${ids.projects.marvell.testProject}/project-version/${ids.versions.testLegacyProject}`)
      .expect(404)
      .expect(response => {
        assert(!response.body.data, 'Response should contain no data');
      });
  });

  it('removes transfer fields if not a transfer (regression)', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/project/${ids.projects.croydon.notATransfer}/project-version/${ids.versions.notATransfer}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.data.transferToEstablishment, undefined);
        assert.equal(response.body.data.data.transferToEstablishmentName, undefined);
      });
  });

  it('maps cameCase species fields to hyphen-separated - bugfix', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.marvell}/project/${ids.projects.marvell.testLegacyProject}/project-version/${ids.versions.testLegacyProject}`)
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

  it('maps the custom conditions prop named "edited" to "content" to fix a migration issue', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.marvell}/project/${ids.projects.marvell.testLegacyProject}/project-version/${ids.versions.testLegacyProject2}`)
      .expect(200)
      .expect(response => {
        const conditions = response.body.data.data.conditions;
        assert.equal(conditions[0].content, 'This is a custom condition', 'Should copy the edited prop to the content prop');
        assert.equal(conditions[0].edited, undefined, 'Should delete the edited prop from the condition');
      });
  });

  it('does not map any fields on schema version 1 licences - bugfix', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.marvell}/project/${ids.projects.marvell.testProject}/project-version/${ids.versions.testProject}`)
      .expect(200)
      .expect(response => {
        const protocols = response.body.data.data.protocols;

        assert.equal(protocols[0].species[0].geneticallyAltered, true, 'Should preserve `geneticallyAltered` value');

      });
  });

});
