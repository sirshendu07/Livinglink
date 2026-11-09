const logger = require('../config/logger');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

const getSocketIO = () => ioInstance;

const emitToUser = (userId, event, data) => {
  if (!ioInstance) return;
  try {
    ioInstance.to(`user:${userId.toString()}`).emit(event, data);
  } catch (err) {
    logger.warn({ err: err.message, userId, event }, 'Socket emitToUser failed');
  }
};

const emitToRole = (role, event, data) => {
  if (!ioInstance) return;
  try {
    ioInstance.to(`role:${role}`).emit(event, data);
  } catch (err) {
    logger.warn({ err: err.message, role, event }, 'Socket emitToRole failed');
  }
};

const emitToFeed = (event, data) => {
  if (!ioInstance) return;
  try {
    ioInstance.to('society:feed').emit(event, data);
  } catch (err) {
    logger.warn({ err: err.message, event }, 'Socket emitToFeed failed');
  }
};

const emitToAll = (event, data) => {
  if (!ioInstance) return;
  try {
    ioInstance.emit(event, data);
  } catch (err) {
    logger.warn({ err: err.message, event }, 'Socket emitToAll failed');
  }
};

module.exports = {
  setSocketIO,
  getSocketIO,
  emitToUser,
  emitToRole,
  emitToFeed,
  emitToAll
};
