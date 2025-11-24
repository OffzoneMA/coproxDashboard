const express = require('express');
const PersonController = require('../controllers/personController');

const router = express.Router();

// Solde management routes (MUST come before /:id routes to avoid conflicts)
router.get('/solde/negative', PersonController.getPersonsWithNegativeSolde);
router.get('/solde/positive', PersonController.getPersonsWithPositiveSolde);
router.get('/solde/stats', PersonController.getSoldeStats);

// Modern API endpoints (specific routes before parameterized ones)
router.get('/copro', PersonController.getAllPersonsWithCopro);  // GET /person/copro?limit=50&page=1
router.get('/getAllPersons', PersonController.getAllPersons);
router.get('/getAllPersonsWithCopro', PersonController.getAllPersonsWithCopro);
router.get('/getAllPersonsWithCoppro', PersonController.getAllPersonsWithCopro); // Alias for typo (backward compatibility)
router.get('/countAllPersons', PersonController.countAllPersons);

// CRUD operations (specific paths before generic ones)
router.post('/addPerson', PersonController.addPerson);
router.put('/editPerson/:id', PersonController.editPerson);
router.get('/getPerson/:id', PersonController.getPerson);
router.get('/getPersonsByCoproId/:idCopro', PersonController.getPersonsByCoproId);
router.get('/getPersonsByCoproId/', PersonController.getPersonsByInfo);

// Parameterized routes (MUST be last to avoid matching everything)
router.post('/:id/solde', PersonController.updatePersonSolde);
router.get('/:id', PersonController.getPerson);  // Alias for getPerson/:id

// Root endpoint (absolute last)
router.get('/', PersonController.getAllPersons);  // GET /person?limit=50&page=1

module.exports = router;
