const Schema = require('@asl/schema');

const snakeCase = str => str.replace(/[A-Z]/g, s => `_${s.toLowerCase()}`);

module.exports = settings => {

  return {
    init: (populate) => {
      const schema = Schema(settings);

      const tables = Object.keys(schema);
      return tables.reduce((p, table) => {
        return p.then(() => {
          if (schema[table].tableName) {
            return schema[table].knex().raw(`truncate ${snakeCase(schema[table].tableName)} cascade;`);
          }
        });
      }, Promise.resolve())
        .then(() => populate && populate(schema))
        .then(() => schema.destroy())
        .catch(err => {
          schema.destroy();
          throw err;
        });
    }
  };

};
