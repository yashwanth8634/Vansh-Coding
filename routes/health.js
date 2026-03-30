// routes/health.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { caches } = require('../utils/cache');

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: {
      status: 'Disconnected',
      error: null,
    },
    redis: {
      status: 'Disconnected',
    },
    environment: {
      MONGO_URI: !!process.env.MONGO_URI,
      UPSTASH_REDIS: !!process.env.UPSTASH_REDIS_REST_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
    }
  };

  try {
    const dbStatus = mongoose.connection.readyState;
    const statuses = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    health.database.status = statuses[dbStatus] || 'Unknown';
  } catch (err) {
    health.database.error = err.message;
  }

  try {
    // Quick cache check
    await caches.pages.set('health-check', 'OK', 5);
    const result = await caches.pages.get('health-check');
    if (result === 'OK') {
        health.redis.status = 'Connected/Functional';
    }
  } catch (err) {
    health.redis.status = 'Error';
    health.redis.error = err.message;
  }

  const overallHealthy = health.database.status === 'Connected';
  res.status(overallHealthy ? 200 : 503).json(health);
});

module.exports = router;
