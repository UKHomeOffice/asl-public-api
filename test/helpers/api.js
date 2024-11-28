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

let workflowInstance;
let apiInstance;

module.exports = {
  create: async (options = {}) => {
    try {
      // Initialize database schema and populate data
      await Database(settings).init(data.default);

      // Initialize the workflow
      workflowInstance = await Workflow();
      if (!workflowInstance.url) {
        throw new Error('Workflow initialization failed: Missing URL.');
      }

      // Create API instance with workflow integration
      const api = await Api({
        auth: false,
        log: { level: 'error' },
        db: settings,
        workflow: workflowInstance.url,
        ...options
      });

      // Wrap API with user handling middleware
      apiInstance = WithUser(api, {});
      console.log('API instance created successfully.');

      return {
        workflow: workflowInstance,
        api: apiInstance
      };
    } catch (error) {
      console.error('Initialization error:', error.message);
      throw error;
    }
  },

  destroy: async () => {
    try {
      // Teardown workflow instance if initialized
      if (workflowInstance) {
        console.log('Tearing down workflow...');
        await workflowInstance.teardown();
        console.log('Workflow teardown completed.');
      } else {
        console.warn('No workflow instance found to teardown.');
      }

      // Destroy Knex connection if API and database are initialized
      const knex = apiInstance?.app?.db;
      if (knex && knex.destroy) {
        await knex.destroy();
        console.log('Knex connection destroyed successfully.');
      } else {
        console.warn('No valid Knex instance found to destroy.');
      }
    } catch (error) {
      console.error('Teardown error:', error.message);
    } finally {
      workflowInstance = null;
      apiInstance = null;
    }
  }
};
