// prestataireController.js
const mongoose = require('mongoose');
const PrestataireService = require('../services/prestataireService');

// ============= PRESTATAIRE CRUD CONTROLLERS =============

async function listPrestataires(req, res) {
  try {
    const result = await PrestataireService.listPrestataires();
    res.json(result);
  } catch (error) {
    console.error('Error listing prestataires:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function detailsPrestataire(req, res) {
  const { id } = req.params;
  try {
    const result = await PrestataireService.detailsPrestataire(id);
    if (!result) {
      return res.status(404).json({ error: 'Prestataire not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching prestataire details:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getPrestataireByIdCompte(req, res) {
  const { idCompte } = req.params;
  try {
    const result = await PrestataireService.getPrestataireByIdCompte(idCompte);
    if (!result) {
      return res.status(404).json({ error: 'Prestataire not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching prestataire by idCompte:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function addPrestataire(req, res) {
  const newPrestataireData = req.body;
  try {
    const result = await PrestataireService.addPrestataire(newPrestataireData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding prestataire:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function editPrestataire(req, res) {
  const { id } = req.params;
  const updatedPrestataireData = req.body;
  try {
    const result = await PrestataireService.editPrestataire(id, updatedPrestataireData);
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Prestataire not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error updating prestataire:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function deletePrestataire(req, res) {
  const { id } = req.params;
  try {
    const result = await PrestataireService.deletePrestataire(id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Prestataire not found' });
    }
    res.json({ message: 'Prestataire deleted successfully', result });
  } catch (error) {
    console.error('Error deleting prestataire:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ============= PRESTATAIRE-COPRO RELATIONSHIP CONTROLLERS =============

async function linkPrestataireToCopro(req, res) {
  const { prestataireId, coproprieteId } = req.params;
  const linkData = req.body;
  try {
    const result = await PrestataireService.linkPrestataireToCopro(
      prestataireId, 
      coproprieteId, 
      linkData
    );
    res.status(201).json(result);
  } catch (error) {
    console.error('Error linking prestataire to copro:', error.message);
    if (error.code === 11000) { // Duplicate key error
      return res.status(409).json({ error: 'Link already exists' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function unlinkPrestataireFromCopro(req, res) {
  const { prestataireId, coproprieteId } = req.params;
  try {
    const result = await PrestataireService.unlinkPrestataireFromCopro(
      prestataireId, 
      coproprieteId
    );
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json({ message: 'Link removed successfully', result });
  } catch (error) {
    console.error('Error unlinking prestataire from copro:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function updatePrestataireCooproLink(req, res) {
  const { prestataireId, coproprieteId } = req.params;
  const linkData = req.body;
  try {
    const result = await PrestataireService.updatePrestataireCooproLink(
      prestataireId, 
      coproprieteId, 
      linkData
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error updating prestataire-copro link:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getCoprosForPrestataire(req, res) {
  const { prestataireId } = req.params;
  try {
    const result = await PrestataireService.getCoprosForPrestataire(prestataireId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching copros for prestataire:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getPrestatairesForCopro(req, res) {
  const { coproprieteId } = req.params;
  try {
    const result = await PrestataireService.getPrestatairesForCopro(coproprieteId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching prestataires for copro:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ============= SYNC OPERATIONS =============

async function triggerSync(req, res) {
  try {
    console.log('Manual sync triggered for prestataires');
    const synchroPrestataire = require('../cron/synchroPrestataire');
    
    // Run sync in background
    synchroPrestataire.start()
      .then(() => console.log('Prestataire sync completed successfully'))
      .catch(err => console.error('Prestataire sync error:', err));
    
    res.json({ 
      message: 'Prestataire synchronization started in background',
      status: 'processing'
    });
  } catch (error) {
    console.error('Error triggering sync:', error.message);
    res.status(500).json({ error: 'Failed to trigger synchronization' });
  }
}

module.exports = {
  // CRUD operations
  listPrestataires,
  detailsPrestataire,
  getPrestataireByIdCompte,
  addPrestataire,
  editPrestataire,
  deletePrestataire,
  
  // Relationship operations
  linkPrestataireToCopro,
  unlinkPrestataireFromCopro,
  updatePrestataireCooproLink,
  getCoprosForPrestataire,
  getPrestatairesForCopro,
  
  // Sync operations
  triggerSync
};
