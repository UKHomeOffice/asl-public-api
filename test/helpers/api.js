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

// Define variables at the module level
let workflowInstance;
let apiInstance;

module.exports = {
  create: async (options = {}) => {
    try {
      // Initialize the database and wait for it to complete
      await Database(settings).init(data.default);

      // Initialize the workflow
      workflowInstance = await Workflow();

      // Initialize the API
      const api = Api({
        auth: false,
        log: { level: 'error' },
        db: settings,
        workflow: workflowInstance.url,
        ...options
      });

      // Wrap the API with user handling
      apiInstance = WithUser(api, {});

      return {
        workflow: workflowInstance,
        api: apiInstance
      };
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error; // Rethrow to handle upstream errors if needed
    }
  },

  destroy: async () => {
    try {
      if (workflowInstance) {
        console.log('Tearing down workflow...');
        await workflowInstance.teardown();
      }

      if (apiInstance) {
        const knex = await apiInstance.app.db;
        knex.destroy();
        console.log('API-Schema instance destroyed...');
      } else {
        console.warn('No destroy method found on apiInstance.app.db.knex');
      }
    } catch (error) {
      console.error('Error during teardown:', error);
    }
  }
};
