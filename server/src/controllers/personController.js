const PersonService = require('../services/personService');

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

async function getAllPersons(req, res) {
  try {
    const persons = await PersonService.getAllPersons();
    res.status(200).json(persons);
  } catch (error) {
    console.error('Error getting all persons:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
async function getAllPersonsWithCoppro(req, res) {
  try {
    const persons = await PersonService.getAllPersonsWithCoppro();
    res.status(200).json(persons);
  } catch (error) {
    console.error('Error getting all persons:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
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


module.exports = { addPerson, editPerson,getPersonsByInfo, getPersonsByCoproId, getAllPersons,countAllPersons,getAllPersonsWithCoppro };
