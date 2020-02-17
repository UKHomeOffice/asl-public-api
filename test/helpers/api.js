const Api = require('../../lib/api');
const data = require('../data');
const Database = require('../helpers/db');
const WithUser = require('../helpers/with-user');
const Workflow = require('../helpers/workflow');

const settings = {
  database: process.env.POSTGRES_DB || 'asl-test',
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  password: process.env.POSTGRES_PASSWORD
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
