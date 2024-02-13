const Pool = require('pg').Pool;

require('dotenv').config();

const pool = new Pool({
    user: process.env.NODE_ENV_USER_NAME,
    host: process.env.NODE_ENV_HOST,
    database: process.env.NODE_ENV_DB_NAME,
    password: process.env.NODE_ENV_PASS,
    port: process.env.NODE_ENV_PORT
});

module.exports = pool;