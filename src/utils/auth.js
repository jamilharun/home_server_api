const jwt = require('jsonwebtoken');

require('dotenv').config();

// Secret key for signing and verifying tokens
const secretKey = process.env.NODE_ENV_SECRET_KEY; // Replace with a strong, secret key

// Function to generate a JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, secretKey, { expiresIn: '2h' }); // Token expires in 2 hour
}

// Middleware to verify the JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token not provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.userId = decoded.userId;
    next();
  });
}

module.exports = { generateToken, verifyToken };
