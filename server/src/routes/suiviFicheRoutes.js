const express = require('express');
const suiviFichenController = require('../controllers/suiviFichenController');

const router = express.Router();

router.put('/getinfo/:id', suiviFichenController.getInfo);
router.get('/generate-pdf/:id', suiviFichenController.generatePdf);


router.post('/addPerson', suiviFichenController.addPerson);
router.put('/editPerson/:id', suiviFichenController.editPerson);
router.get('/getPersonsByCoproId/:idCopro', suiviFichenController.getPersonsByCoproId);
router.get('/getPersonsByCoproId/', suiviFichenController.getPersonsByInfo);
router.get('/getAllPersons', suiviFichenController.getAllPersons);
router.get('/countAllPersons', suiviFichenController.countAllPersons);


module.exports = router;
