module.exports = params => {

  if (!params.action) {
    throw new Error('`action` is required');
  }
  if (!params.model) {
    throw new Error('`model` is required');
  }
  if ((params.action === 'update' || params.action === 'delete') && !params.id) {
    throw new Error('`id` is required for update or delete actions');
  }
  if ((params.action === 'update' || params.action === 'create') && !params.data) {
    throw new Error('`data` is required for update or create actions');
  }

};
