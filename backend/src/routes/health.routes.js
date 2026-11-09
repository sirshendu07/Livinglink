const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { cacheService } = require('../config/redis');
const ApiResponse = require('../utils/apiResponse');

router.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  const redisStatus = cacheService.isConnected() ? 'CONNECTED' : 'DEGRADED_FALLBACK';

  const isHealthy = mongoStatus === 'CONNECTED';

  return ApiResponse.success(
    res,
    isHealthy ? 'LivingLink Backend is healthy' : 'System Degraded',
    {
      status: isHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        engine: 'MongoDB',
        status: mongoStatus
      },
      cache: {
        engine: 'Redis',
        status: redisStatus
      },
      nodeVersion: process.version
    },
    isHealthy ? 200 : 503
  );
});

module.exports = router;
