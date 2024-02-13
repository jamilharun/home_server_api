// Install necessary packages: npm install --save-dev mocha supertest

// Create a test file (e.g., test/api.test.js)
const request = require('supertest');
const assert = require('assert');
const app = require('../index.js'); // Import your Express app

describe('API Tests', () => {
  it('checking db health', async () => {
    const response = await request(app).get('/health');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.text, 'Database connection is healthy');
  })
  
  it('should return all users', async () => {
    const response = await request(app).get('/users');
    assert.strictEqual(response.status, 200);
    assert.ok(response.body.users.length > 0);
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/register')
      .send({ email: 'test@example.com', password: 'password123' });

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.token);
  });

  // Add more tests for other endpoints
});
