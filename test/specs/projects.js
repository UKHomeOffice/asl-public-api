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

  it('returns only the current establishments projects when searching - bugfix', () => {
    return request(this.api)
      .get('/establishment/100/projects?search=abc&status=inactive') // "abc" matches licence number for all projects
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1, 'Returns exactly one project');
        assert.equal(response.body.data[0].title, 'Test project 1');
      });
  });

});
