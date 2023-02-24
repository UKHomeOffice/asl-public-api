module.exports = (req, res, next) => {
  res.sendResponse = () => {
    if (!req.permissionChecked) {
      const nopes = ['/tasks', '/me'];
      if (!nopes.includes(req.path)) {
        req.log('info', { url: req.originalUrl, event: 'unchecked-permissions' });
      }
    }
    if (res.response !== undefined) {
      const response = {};
      if (!req.query.onlymeta) {
        response.data = res.response;
      }
      response.meta = Object.assign({}, res.meta);
      if (req.establishment) {
        response.meta.establishment = {
          id: req.establishment.id,
          name: req.establishment.name,
          status: req.establishment.status,
          revocationDate: req.establishment.revocationDate,
          issueDate: req.establishment.issueDate,
          isTrainingEstablishment: req.establishment.isTrainingEstablishment,
          corporateStatus: req.establishment.corporateStatus
        };
      }
      return res.json(response);
    }
  };
  next();
};
