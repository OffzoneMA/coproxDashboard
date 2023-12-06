const express = require('express');
const PersonController = require('../controllers/personController');

const router = express.Router();

router.post('/addPerson', PersonController.addPerson);
router.put('/editPerson/:id', PersonController.editPerson);
router.get('/getPersonsByCoproId/:idCopro', PersonController.getPersonsByCoproId);
router.get('/getAllPersons', PersonController.getAllPersons);

module.exports = router;
