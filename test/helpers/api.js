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
      await Promise.race([
        Database(settings).init(data.default),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('Database initialization timeout after 5 seconds')), 5000))
      ]);

      workflowInstance = await Workflow();
      if (!workflowInstance.url) {
        throw new Error('Workflow initialization failed: Missing URL.');
      }

      const api = Api({
        auth: false,
        log: { level: 'error' },
        db: settings,
        workflow: workflowInstance.url,
        ...options
      });

      // Wrap the API with user handling middleware
      apiInstance = await WithUser(api, {});

      return {
        workflow: workflowInstance.url,
        api: apiInstance
      };
    } catch (error) {
      console.error('Initialization error:', error.message);
      throw error;
    }
  },

  destroy: async () => {
    try {
      if (workflowInstance) {
        console.log('Tearing down workflow start...');
        await workflowInstance.teardown();
        console.log('Workflow teardown completed.');
      } else {
        console.warn('No workflow instance found to teardown.');
      }

      // Safely destroy Knex database connection
      if (apiInstance.app.db) {
        const knex = await apiInstance.app.db;
        if (knex.destroy) {
          await knex.destroy();
          console.log('Knex connection destroyed successfully.');
        } else {
          console.warn('Knex instance missing or does not have a destroy method.');
        }
      } else {
        console.warn('No API or Knex instance found to destroy.');
      }
    } catch (error) {
      console.error('Teardown error:', error.message);
    }
  }
};
