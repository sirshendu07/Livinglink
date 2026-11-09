const { Server } = require('socket.io');
const socketAuthMiddleware = require('./socketAuth');
const { setSocketIO } = require('./socketEmitter');
const logger = require('../config/logger');
const env = require('../config/env');

const initSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  // Apply authenticated handshake middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info({ userId: user._id, role: user.role, socketId: socket.id }, 'Socket client connected');

    // Automatically join user's private room
    const userRoom = `user:${user._id.toString()}`;
    socket.join(userRoom);

    // Automatically join role-specific room (e.g. role:ADMIN, role:SECURITY)
    const roleRoom = `role:${user.role}`;
    socket.join(roleRoom);

    // Join common society feed room
    socket.join('society:feed');

    socket.on('disconnect', (reason) => {
      logger.info({ userId: user._id, reason }, 'Socket client disconnected');
    });

    socket.on('error', (err) => {
      logger.warn({ userId: user._id, err: err.message }, 'Socket client error');
    });
  });

  setSocketIO(io);
  return io;
};

module.exports = initSocketIO;
