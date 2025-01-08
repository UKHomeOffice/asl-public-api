const API = require('./lib/api');
const settings = require('./config');

async function startServer() {
  try {
    // Wait for the API function to resolve and return the app instance
    const app = await API(settings);

    // Use the resolved app instance to start the server
    const server = app.listen(settings.port, (err) => {
      if (err) {
        console.error('Error starting the server:', err);
        return;
      }
      console.log(`Server is listening on port ${settings.port}`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => handleGracefulShutdown(server));
  } catch (error) {
    console.error('Error initializing the server:', error);
  }
}

function handleGracefulShutdown(server) {
  if (server.listening) {
    console.log('Gracefully shutting down the server...');
    server.close(() => {
      console.log('Server has been closed. Exiting.');
      process.exit();
    });
  }
}

startServer();
