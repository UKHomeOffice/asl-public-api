const express = require('express');
const sinon = require('sinon');
const bodyParser = require('body-parser');

module.exports = () => {

  let port;
  const app = express();
  const handler = sinon.stub().yieldsAsync();

  app.use(bodyParser.json());

  app.use(handler);

  app.use((req, res) => {
    res.json({ state: { id: '67e1e643-dace-44e0-af8c-940c997a5ae3' } });
  });

  return new Promise((resolve, reject) => {

    const server = app.listen(err => {
      if (err) {
        return reject(err);
      }
      port = server.address().port;
      resolve({
        url: `http://localhost:${port}`,
        handler,
        teardown: () => new Promise((resolve, reject) => {
          server.close(() => resolve());
        })
      });
    });

  });

};
