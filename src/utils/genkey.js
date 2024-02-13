const crypto = require('crypto');
// Load secret key from environment variable
const secretKey = process.env.SECRET_KEY; 

// Validate that key is set
if(!secretKey) {
  throw new Error('SECRET_KEY environment variable is not set');
}

// Generate a new key if needed
if(secretKey === 'your-secret-key') {
  secretKey = generateSecretKey(); 
  console.log('Generated new SECRET_KEY');
  
  // Save key to .env file
  require('dotenv').config();
  process.env.SECRET_KEY = secretKey;
}

function generateSecretKey() {
  // Use crypto library to generate cryptographically-strong pseudo-random key
  return crypto.randomBytes(32).toString('hex'); 
}

// Use key for encryption, etc...
