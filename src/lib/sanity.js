const Redis = require('ioredis');
const sanityClient = require('@sanity/client');

require('dotenv').config();

// Initialize Redis client
const redisClient = new Redis();

// Initialize Sanity.io client
const sanity = sanityClient({
  projectId: process.env.NODE_ENV_SANITY_PROJECT_ID,
  dataset: process.env.NODE_ENV_SANITY_DATASET,
  token: process.env.NODE_ENV_SANITY_TOKEN,
  useCdn: false, // Set to true for production
});
