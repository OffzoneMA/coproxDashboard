const suiviFichenService = require('../services/suiviFichenService');

async function addPerson(req, res) {
  try {
    const result = await suiviFichenService.addPerson(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error adding person:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function editPerson(req, res) {
  try {
    const result = await suiviFichenService.editPerson(req.params.id, req.body);
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

async function getInfo(req, res) {
  try {
    const fiche = await suiviFichenService.getInfo(req.params.idCopro);
    res.status(200).json(fiche);

  } catch (error) {
    console.error('Error editing fiche:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function generatePdf(req, res) {
  try {
    const id = req.params.id;

    const pdfBuffer = await suiviFichenService.generatePdf(id);

    // Serve the PDF to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  }
}


async function getPersonsByCoproId(req, res) {
  try {
    const persons = await suiviFichenService.getPersonsByCoproId(req.params.idCopro);
    res.status(200).json(persons);
  } catch (error) {
    console.error('Error getting persons by coproId:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getPersonsByInfo(req, res) {
  try {
    const persons = await suiviFichenService.getPersonsByInfo(req.body.name,req.body.value);
    res.status(200).json(persons);
  } catch (error) {
    console.error('Error getting persons by Infos:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getAllPersons(req, res) {
  try {
    const persons = await suiviFichenService.getAllPersons();
    res.status(200).json(persons);
  } catch (error) {
    console.error('Error getting all persons:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
async function countAllPersons(req, res) {
  try {
    const count = await suiviFichenService.countAllPersons();
    res.status(200).json(count);
  } catch (error) {
    console.error('Error getting all persons:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


module.exports = { addPerson,getInfo,generatePdf, editPerson,getPersonsByInfo, getPersonsByCoproId, getAllPersons,countAllPersons };
