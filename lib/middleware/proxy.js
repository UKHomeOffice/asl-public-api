const HttpProxy = require('http-proxy');
const streamify = require('into-stream');

module.exports = target => {

  const proxy = HttpProxy.createProxyServer();

  return (req, res, next) => {
    const buffer = req._body && streamify(JSON.stringify(req.body));
    proxy.web(req, res, { target, buffer, secure: false, changeOrigin: true }, err => next(err));
  };

};
