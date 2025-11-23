// prestataireRoutes.js
const express = require('express');
const PrestataireController = require('../controllers/prestataireController');

const router = express.Router();

// ============= PRESTATAIRE CRUD ROUTES =============

// List all prestataires
router.get('/list', PrestataireController.listPrestataires);

// Get prestataire by ID
router.get('/details/:id', PrestataireController.detailsPrestataire);

// Get prestataire by idCompte
router.get('/byIdCompte/:idCompte', PrestataireController.getPrestataireByIdCompte);

// Add new prestataire
router.post('/add', PrestataireController.addPrestataire);

// Update prestataire
router.put('/edit/:id', PrestataireController.editPrestataire);

// Delete prestataire
router.delete('/delete/:id', PrestataireController.deletePrestataire);

// ============= PRESTATAIRE-COPRO RELATIONSHIP ROUTES =============

// Link prestataire to copro
router.post('/link/:prestataireId/:coproprieteId', PrestataireController.linkPrestataireToCopro);

// Unlink prestataire from copro
router.delete('/unlink/:prestataireId/:coproprieteId', PrestataireController.unlinkPrestataireFromCopro);

// Update link between prestataire and copro
router.put('/updateLink/:prestataireId/:coproprieteId', PrestataireController.updatePrestataireCooproLink);

// Get all copros for a prestataire
router.get('/:prestataireId/copros', PrestataireController.getCoprosForPrestataire);

// Get all prestataires for a copro
router.get('/copro/:coproprieteId/prestataires', PrestataireController.getPrestatairesForCopro);

// ============= SYNC OPERATIONS =============

// Trigger manual synchronization
router.post('/sync', PrestataireController.triggerSync);

// ============= TEST/HEALTH CHECK =============

// Health check endpoint to verify routes are loaded
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Prestataire routes are working',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
