const request = require('supertest');
const express = require('express');
const suiviAgRoutes = require('../src/routes/suiviAgRoutes');

const app = express();
app.use(express.json());
app.use('/suiviAg', suiviAgRoutes);

describe('SuiviAg Routes', () => {
  it('should handle a GET request to /suiviAg', async () => {
    const response = await request(app).get('/suiviAg');

    expect(response.status).toBe(200);
    // Add more assertions to validate the response body or other properties
  });

  it('should handle a POST request to /suiviAg', async () => {
    const response = await request(app)
      .post('/suiviAg')
      .send({ data: 'Test data' });

    expect(response.status).toBe(200);
    // Add more assertions to validate the response body or other properties
  });

  // Add more tests for other routes and methods
});