const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');
const { initRedis, cacheService } = require('./config/redis');
const initSocketIO = require('./sockets');

const server = http.createServer(app);

// Initialize Socket.IO with HTTP server
initSocketIO(server);

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    // Initialize Redis client
    initRedis();

    // Start listening
    const PORT = env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`LivingLink Backend Server running in ${env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`Swagger Documentation available at http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await cacheService.disconnect();
      await disconnectDB();
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force close after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err: err.message, stack: err.stack }, 'Uncaught Exception');
  process.exit(1);
});

// Run server if started directly
if (require.main === module) {
  startServer();
}

module.exports = {
  server,
  startServer
};
