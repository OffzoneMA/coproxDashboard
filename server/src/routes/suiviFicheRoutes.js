const express = require('express');
const suiviFichenController = require('../controllers/suiviFichenController');

const router = express.Router();

router.get('/getAllFiches', suiviFichenController.getAllFiches);
router.get('/getFichesByCoproId/:idCopro', suiviFichenController.getFichesByCoproId);
router.get('/getinfo/:id', suiviFichenController.getInfo);
router.get('/generate-pdf/:id', suiviFichenController.generatePdf);
router.post('/saveFiches', suiviFichenController.saveFiches);
router.put('/getinfo/:id', suiviFichenController.getInfo);
router.put('/editFiche/:id', suiviFichenController.editFiche);
router.get('/getPersonsByCoproId/', suiviFichenController.getPersonsByInfo);
router.get('/getAllFiches', suiviFichenController.getAllFiches);
router.get('/countAllPersons', suiviFichenController.countAllPersons);


module.exports = router;
