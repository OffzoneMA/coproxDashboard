const request = require('supertest');
const app = require('../src/app');
const PersonController = require('../src/controllers/personController');

describe('Person Routes', () => {
  // Test GET /persons route
  describe('GET /persons', () => {
    it('should return all persons', async () => {
      const response = await request(app).get('/persons');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(PersonController.getAllPersons());
    });
  });

  // Test POST /persons route
  describe('POST /persons', () => {
    it('should create a new person', async () => {
      const newPerson = {
        name: 'John Doe',
        age: 30,
        email: 'john.doe@example.com'
      };

      const response = await request(app).post('/persons').send(newPerson);
      expect(response.status).toBe(201);
      expect(response.body).toEqual(PersonController.createPerson(newPerson));
    });
  });

  // Test GET /persons/:id route
  describe('GET /persons/:id', () => {
    it('should return the specified person', async () => {
      const personId = 1;
      const response = await request(app).get(`/persons/${personId}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(PersonController.getPersonById(personId));
    });

    it('should return 404 if person is not found', async () => {
      const personId = 999;
      const response = await request(app).get(`/persons/${personId}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Person not found' });
    });
  });

  // Test PUT /persons/:id route
  describe('PUT /persons/:id', () => {
    it('should update the specified person', async () => {
      const personId = 1;
      const updatedPerson = {
        name: 'Jane Smith',
        age: 35,
        email: 'jane.smith@example.com'
      };

      const response = await request(app).put(`/persons/${personId}`).send(updatedPerson);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(PersonController.updatePerson(personId, updatedPerson));
    });

    it('should return 404 if person is not found', async () => {
      const personId = 999;
      const updatedPerson = {
        name: 'Jane Smith',
        age: 35,
        email: 'jane.smith@example.com'
      };

      const response = await request(app).put(`/persons/${personId}`).send(updatedPerson);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Person not found' });
    });
  });

  // Test DELETE /persons/:id route
  describe('DELETE /persons/:id', () => {
    it('should delete the specified person', async () => {
      const personId = 1;
      const response = await request(app).delete(`/persons/${personId}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Person deleted successfully' });
    });

    it('should return 404 if person is not found', async () => {
      const personId = 999;
      const response = await request(app).delete(`/persons/${personId}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Person not found' });
    });
  });
});