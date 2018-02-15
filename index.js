const API = require('./lib/api');
const settings = require('./config');

API(settings).then(app => {
  const server = app.listen(settings.port, (err, result) => {
    if (err) {
      return console.error(err);
    }
    console.log(`Listening on port ${server.address().port}`);
  });
});

process.on('SIGINT', () => {
  if (server.listening) {
    console.log('Attempting to exit gracefully.');
    server.close(() => {
      console.log('Server closed. Quitting.');
      process.exit();
    });
  }
});
