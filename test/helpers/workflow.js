const express = require('express');
const sinon = require('sinon');
const bodyParser = require('body-parser');

module.exports = async () => {
  const app = express();
  const handler = sinon.stub().yieldsAsync();

  app.use(bodyParser.json());
  app.use(handler);

  app.use((req, res) => {
    res.json({ data: {} });
  });

  try {
    const server = await startServer(app);
    const port = server.address().port;
    console.log(`Server started on port ${port}`);

    return {
      url: `http://localhost:${port}`,
      handler,
      teardown: () => shutdownServer(server)
    };
  } catch (err) {
    console.error('Error starting server:', err);
    throw err; // Rethrow the error to be handled by the caller
  }
};

// Helper function to start the server
const startServer = (app) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, (err) => {
      if (err) return reject(err);
      resolve(server);
    });
  });
};

// Helper function to shut down the server
const shutdownServer = (server) => {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};
