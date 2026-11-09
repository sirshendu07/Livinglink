const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

let isConnected = false;

const connectDB = async (uri = env.MONGODB_URI) => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB runtime error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Retrying connection...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    return conn;
  } catch (error) {
    logger.error({ error: error.message }, 'MongoDB connection failure');
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly');
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
