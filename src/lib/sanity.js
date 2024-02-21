const {createClient} = require('@sanity/client');

require('dotenv').config();

// Initialize Redis client

// Initialize Sanity.io client
const sanity = createClient({
  projectId: process.env.NODE_ENV_SANITY_PROJECT_ID,
  dataset: process.env.NODE_ENV_SANITY_DATASET,
  token: process.env.NODE_ENV_SANITY_TOKEN,
  apiVersion: '2021-10-21',
  useCdn: true, // Set to true for production
});
module.exports = sanity