// coproRoutes.js
const express = require('express');
const CoproController = require('../controllers/coproController');

const router = express.Router();

router.post('/addCopro', CoproController.addCopro);
router.put('/editCopro/:id', CoproController.editCopro);

module.exports = router;
