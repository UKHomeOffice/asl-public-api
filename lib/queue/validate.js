module.exports = data => {

  if (!data.action) {
    throw new Error('`action` is required');
  }
  if (!data.model) {
    throw new Error('`model` is required');
  }
  if (!data.user) {
    throw new Error('`user` is required');
  }
  if ((data.action === 'update' || data.action === 'delete') && !data.id) {
    throw new Error('`id` is required for update or delete actions');
  }
  if ((data.action === 'update' || data.action === 'create') && !data.data) {
    throw new Error('`data` is required for update or create actions');
  }

};
