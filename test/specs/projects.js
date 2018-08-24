const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

describe('/projects', () => {
  before(() => {
    return apiHelper.create()
      .then(() => {
        this.api = apiHelper.api;
      });
  });

  after(() => {
    return apiHelper.destroy();
  });

  it('returns only the current establishments projects when searching - bugfix', () => {
    return request(this.api)
      .get('/establishment/100/projects?search=abc') // "abc" matches licence number for all projects
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1, 'Returns exactly one project');
        assert.equal(response.body.data[0].title, 'Test project 1');
      });
  });

});
