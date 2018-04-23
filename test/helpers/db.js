const Schema = require('@asl/schema');

module.exports = settings => {

  return {
    init: (populate) => {
      const schema = Schema(settings);
      return schema.sync({ force: true })
        .then(() => populate && populate(schema))
        .finally(() => schema.close());
    }
  };

};
