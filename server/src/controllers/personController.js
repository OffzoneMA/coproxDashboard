const PersonService = require('../services/personService');
const { parsePaginationParams, parseFilterParams, buildPaginationResponse } = require('../utils/paginationHelper');
const mongoose = require('mongoose');

async function addPerson(req, res) {
  try {
    const result = await PersonService.addPerson(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error adding person:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function editPerson(req, res) {
  try {
    const result = await PersonService.editPerson(req.params.id, req.body);
    if (result.matchedCount > 0) {
      res.status(200).json({ message: 'Person updated successfully' });
    } else {
      res.status(404).json({ error: 'Person not found' });
    }
  } catch (error) {
    console.error('Error editing person:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getPerson(req, res) {
  try {
    const person = await PersonService.getPerson(req.params.id);
    if (person) {
      res.status(200).json(person);
    } else {
      res.status(404).json({ error: 'Person not found' });
    }
  } catch (error) {
    console.error('Error getting person:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getPersonsByCoproId(req, res) {
  try {
    const persons = await PersonService.getPersonsByCoproId(req.params.idCopro);
    res.status(200).json(persons);
  } catch (error) {
    console.error('Error getting persons by coproId:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getPersonsByInfo(req, res) {
  try {
    const persons = await PersonService.getPersonsByInfo(req.body.name,req.body.value);
    res.status(200).json(persons);
  } catch (error) {
    console.error('Error getting persons by Infos:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get all persons with pagination support
 * Query params: limit, page, sortBy, sortOrder, active, idCopro
 * Example: GET /person?limit=50&page=2&sortBy=nom&sortOrder=asc&active=true
 */
async function getAllPersons(req, res) {
  try {
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      defaultLimit: 100,
      defaultSortField: 'nom',
      defaultSortOrder: 'asc',
      maxLimit: 1000
    });
    
    // Parse filter parameters
    const filter = {};
    
    // Handle active filter (boolean)
    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }
    
    // Handle idCopro filter (ObjectId)
    if (req.query.idCopro) {
      try {
        filter.idCopro = new mongoose.Types.ObjectId(req.query.idCopro);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid idCopro format' });
      }
    }
    
    // Handle search by name (case-insensitive partial match)
    if (req.query.nom) {
      filter.nom = { $regex: req.query.nom, $options: 'i' };
    }
    if (req.query.prenom) {
      filter.prenom = { $regex: req.query.prenom, $options: 'i' };
    }
    
    // Call service with pagination options
    const result = await PersonService.getAllPersons({
      limit: paginationParams.limit,
      skip: paginationParams.skip,
      sort: paginationParams.sort,
      filter
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting all persons:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

/**
 * Get all persons enriched with copro data - with pagination
 * Query params: limit, page, sortBy, sortOrder, active, idCopro
 * Example: GET /person/copro?limit=50&page=2&active=true
 */
async function getAllPersonsWithCopro(req, res) {
  try {
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      defaultLimit: 100,
      defaultSortField: 'nom',
      defaultSortOrder: 'asc',
      maxLimit: 1000
    });
    
    // Parse filter parameters
    const filter = {};
    
    // Handle active filter (boolean)
    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }
    
    // Handle idCopro filter (ObjectId)
    if (req.query.idCopro) {
      try {
        filter.idCopro = new mongoose.Types.ObjectId(req.query.idCopro);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid idCopro format' });
      }
    }
    
    // Handle search by name (case-insensitive partial match)
    if (req.query.nom) {
      filter.nom = { $regex: req.query.nom, $options: 'i' };
    }
    if (req.query.prenom) {
      filter.prenom = { $regex: req.query.prenom, $options: 'i' };
    }
    
    // Call service with pagination options
    const result = await PersonService.getAllPersonsWithCopro({
      limit: paginationParams.limit,
      skip: paginationParams.skip,
      sort: paginationParams.sort,
      filter
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting all persons with copro:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

async function countAllPersons(req, res) {
  try {
    const count = await PersonService.countAllPersons();
    res.status(200).json(count);
  } catch (error) {
    console.error('Error getting all persons:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ==================== Solde Management Endpoints ====================

/**
 * Update solde for a person
 * POST /person/:id/solde
 * Body: { solde: number, source?: string }
 */
async function updatePersonSolde(req, res) {
  try {
    const { solde, source } = req.body;
    
    if (solde === undefined || solde === null) {
      return res.status(400).json({ error: 'Solde is required' });
    }
    
    if (typeof solde !== 'number') {
      return res.status(400).json({ error: 'Solde must be a number' });
    }
    
    const result = await PersonService.updatePersonSolde(
      req.params.id,
      solde,
      source || 'manual'
    );
    
    res.status(200).json({
      success: true,
      message: 'Solde updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating person solde:', error.message);
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get persons with negative solde
 * GET /person/solde/negative?limit=50&page=1
 */
async function getPersonsWithNegativeSolde(req, res) {
  try {
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      defaultLimit: 100,
      defaultSortField: 'solde',
      defaultSortOrder: 'asc',
      maxLimit: 1000
    });
    
    const result = await PersonService.getPersonsWithNegativeSolde({
      limit: paginationParams.limit,
      skip: paginationParams.skip,
      sort: paginationParams.sort
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting persons with negative solde:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get persons with positive solde
 * GET /person/solde/positive?limit=50&page=1
 */
async function getPersonsWithPositiveSolde(req, res) {
  try {
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      defaultLimit: 100,
      defaultSortField: 'solde',
      defaultSortOrder: 'desc',
      maxLimit: 1000
    });
    
    const result = await PersonService.getPersonsWithPositiveSolde({
      limit: paginationParams.limit,
      skip: paginationParams.skip,
      sort: paginationParams.sort
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting persons with positive solde:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get solde statistics
 * GET /person/solde/stats
 */
async function getSoldeStats(req, res) {
  try {
    const stats = await PersonService.getSoldeStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting solde stats:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  addPerson,
  editPerson,
  getPerson,
  getPersonsByCoproId,
  getPersonsByInfo,
  getAllPersons,
  getAllPersonsWithCopro,
  countAllPersons,
  updatePersonSolde,
  getPersonsWithNegativeSolde,
  getPersonsWithPositiveSolde,
  getSoldeStats
};
