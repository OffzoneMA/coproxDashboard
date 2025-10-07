const express = require('express');
const PersonController = require('../controllers/personController');

const router = express.Router();

router.post('/addPerson', PersonController.addPerson);
router.put('/editPerson/:id', PersonController.editPerson);
router.get('/getPerson/:id', PersonController.getPerson);
router.get('/getPersonsByCoproId/:idCopro', PersonController.getPersonsByCoproId);
router.get('/getPersonsByCoproId/', PersonController.getPersonsByInfo);
router.get('/getAllPersons', PersonController.getAllPersons);
router.get('/getAllPersonsWithCoppro', PersonController.getAllPersonsWithCoppro);
router.get('/countAllPersons', PersonController.countAllPersons);


module.exports = router;
