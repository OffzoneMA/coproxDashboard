// lebarocoproRoutes.js
const express = require('express');
const lebarocoproModule = require('../controllers/lebarocoproController');

const router = express.Router();

router.get('/lebarocopro/:id', lebarocoproModule.getLastTemporalRecord);
router.post('/addlebarocopro', lebarocoproModule.addLebarocopro);

module.exports = router;
