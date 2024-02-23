const Redis = require('ioredis');

require('dotenv').config();

const redisClient = new Redis({
    port: process.env.NODE_ENV_REDIS_PORT,
    connectTimeout: 10000, // Set a longer timeout in milliseconds
    // ... other options
});
  
module.exports = redisClient;