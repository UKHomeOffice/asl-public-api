const Api = require('../../lib/api');
const data = require('../data');
const Database = require('../helpers/db');
const WithUser = require('../helpers/with-user');
const Workflow = require('../helpers/workflow');

const settings = {
  database: process.env.DATABASE_NAME || 'asl-test',
  user: process.env.DATABASE_USERNAME || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  password: process.env.DATABASE_PASSWORD || 'test-password'
};

module.exports = {
  create: (options = {}) => {
    return Database(settings).init(data.default)
      .then(() => Workflow())
      .then(workflow => {
        const api = Api(Object.assign({
          auth: false,
          log: { level: 'error' },
          db: settings,
          workflow: workflow.url
        }, options));
        this.workflow = workflow;
        this.api = WithUser(api, {});
        return {
          workflow,
          api: this.api
        };
      });
  },

  destroy: () => {
    return this.workflow.teardown()
      .then(() => {
        return this.api && this.api.app.db.destroy();
      });
  }
};
