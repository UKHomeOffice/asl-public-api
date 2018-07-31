const Schema = require('@asl/schema');

module.exports = settings => {

  return {
    init: (populate) => {
      const schema = Schema(settings);
      return Promise.all([
        'Project',
        'Permission',
        'Authorisation',
        'PIL',
        'Place',
        'Role',
        'TrainingModule',
        'Profile',
        'Establishment'
      ].map(model => {
        return schema[model].query()
          .delete();
      }))
        .then(() => populate && populate(schema))
        .finally(() => schema.destroy());
    }
  };

};
