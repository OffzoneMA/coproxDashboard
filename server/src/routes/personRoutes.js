const express = require('express');
const PersonController = require('../controllers/personController');

const router = express.Router();

// Basic CRUD
router.post('/addPerson', PersonController.addPerson);
router.put('/editPerson/:id', PersonController.editPerson);
router.get('/getPerson/:id', PersonController.getPerson);
router.get('/getPersonsByCoproId/:idCopro', PersonController.getPersonsByCoproId);
router.get('/getPersonsByCoproId/', PersonController.getPersonsByInfo);
router.get('/getAllPersons', PersonController.getAllPersons);
router.get('/getAllPersonsWithCopro', PersonController.getAllPersonsWithCopro);
router.get('/countAllPersons', PersonController.countAllPersons);

// Solde management routes
router.post('/:id/solde', PersonController.updatePersonSolde);
router.get('/solde/negative', PersonController.getPersonsWithNegativeSolde);
router.get('/solde/positive', PersonController.getPersonsWithPositiveSolde);
router.get('/solde/stats', PersonController.getSoldeStats);

module.exports = router;
