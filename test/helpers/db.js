const aslSchema = require('../../scripts/asl-schema');

const snakeCase = (str) => str.replace(/[A-Z]/g, (s) => `_${s.toLowerCase()}`);

module.exports = (settings) => {
  return {
    init: async (populate) => {
      const schema = await aslSchema(settings);
      try {
        for (const table of Object.keys(schema)) {
          // Exclude 'knex', 'transaction', and 'destroy' explicitly
          if (
            schema[table] &&
            schema[table].tableName &&
            !['knex', 'transaction', 'destroy'].includes(table)
          ) {
            const tableName = snakeCase(schema[table].tableName);
            try {
              await schema[table].knex().client.raw(`TRUNCATE ${tableName} CASCADE;`);
            } catch (error) {
              console.error(`Error truncating table ${tableName}:`, error);
            }
          }
        }

        if (populate) {
          await populate(schema);
          console.log('data populate ran!!!');
        }
        return schema;
      } catch (err) {
        console.error('Error during initialization:', err);
        throw err;
      } finally {
        await schema.destroy();
        console.log('API-Schema resource destroyed.');
      }
    }
  };
};
