const { getDBStatus } = require('../config/db');

/**
 * @desc Get system and database health status
 * @route GET /api/health
 * @access Public
 */
const getHealthStatus = (req, res) => {
  const dbStatus = getDBStatus();
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    data: {
      status: 'operational',
      service: 'VideoFlow API Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(uptime),
      database: {
        status: dbStatus,
        uri: process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@') : 'mongodb://127.0.0.1:27017/videoflow',
        connected: dbStatus === 'connected',
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMB: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
      },
    },
  });
};

module.exports = { getHealthStatus };
