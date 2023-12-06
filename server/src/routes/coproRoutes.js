// coproRoutes.js
const express = require('express');
const CoproController = require('../controllers/coproController');

const router = express.Router();

router.get('/listCopro', CoproController.listCopropriete); // Keep the same endpoint name
router.get('/detailsCopro/:id', CoproController.detailsCopropriete); // Keep the same endpoint name
router.get('/countOffers', CoproController.countOffers);
router.get('/coprowithoutag', CoproController.countCoproprieteWithoutSuiviAG); // Keep the same endpoint name
router.get('/lebarocopro/:id', CoproController.getLastTemporalRecord);

router.post('/addlebarocopro', CoproController.addLebarocopro);
router.post('/addCopro', CoproController.addCopropriete); // Keep the same endpoint name
router.put('/editCopro/:id', CoproController.editCopropriete); // Keep the same endpoint name

module.exports = router;
