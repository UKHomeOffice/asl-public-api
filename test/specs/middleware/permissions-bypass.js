const assert = require('assert');
const express = require('express');
const request = require('supertest');
const sinon = require('sinon');
const { permissionsBypass } = require('../../../lib/middleware');
const ids = require('../../data/ids');

const can = sinon.stub();
const endpoint = `/establishment/${ids.establishments.croydon}/project/100/project-version/100`;

describe('Permissions bypass middleware', () => {
  beforeEach(() => {
    this.api = express();
    this.api.use((req, res, next) => {
      req.user = { can };
      next();
    });
    this.api.use(permissionsBypass);
    this.api.get(endpoint, (req, res) => res.json({ permissionHoles: req.permissionHoles }));
  });

  it('doesn\'t set permission holes if user can read project', () => {
    can.withArgs('project.read.single').resolves(true);

    return request(this.api)
      .get(endpoint)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.permissionHoles, undefined);
      });
  });

  it('doesn\'t set permission holes if user cannot read project or version', () => {
    can.withArgs('project.read.single').resolves(false);
    can.withArgs('projectVersion.read').resolves(false);

    return request(this.api)
      .get(endpoint)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.permissionHoles, undefined);
      });
  });

  it('set permission holes if user cannot read project but can read version', () => {
    can.withArgs('project.read.single').resolves(false);
    can.withArgs('projectVersion.read').resolves(true);

    const expected = [
      'establishment.read',
      'project.read'
    ];

    return request(this.api)
      .get(endpoint)
      .expect(200)
      .expect(response => {
        assert.deepEqual(response.body.permissionHoles, expected);
      });
  });
});
