// coproRoutes.test.js
const request = require('supertest');
const express = require('express');
const coproRoutes = require('../src/routes/coproRoutes');

const app = express();
app.use(express.json());
app.use('/copro', coproRoutes);

describe('Copro Routes', () => {
  it('should handle a GET request to /copro/listCopro', async () => {
    const response = await request(app).get('/copro/listCopro');

    expect(response.status).toBe(200);
    // Add more assertions to validate the response body or other properties
  });

  it('should handle a GET request to /copro/detailsCopro/:id', async () => {
    const response = await request(app).get('/copro/detailsCopro/123');

    expect(response.status).toBe(200);
    // Add more assertions to validate the response body or other properties
  });

  it('should handle a POST request to /copro/addCopro', async () => {
    const response = await request(app)
      .post('/copro/addCopro')
      .send({ name: 'Test Copro' });

    expect(response.status).toBe(200);
    // Add more assertions to validate the response body or other properties
  });

  it('should handle a PUT request to /copro/editCopro/:id', async () => {
    const response = await request(app)
      .put('/copro/editCopro/123')
      .send({ name: 'Updated Copro' });

    expect(response.status).toBe(200);
    // Add more assertions to validate the response body or other properties
  });

  // Add more tests for other routes and methods
});