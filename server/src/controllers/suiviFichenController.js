const suiviFichenService = require('../services/suiviFichenService');

async function saveFiches(req, res) {
  try {
    const result = await suiviFichenService.saveFiches(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error adding person:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function editFiche(req, res) {
  try {
    const result = await suiviFichenService.editFiche(req.params.id, req.body);
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
    const fiche = await suiviFichenService.getInfo(req.params.id);
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


async function getFichesByCoproId(req, res) {
  try {
    const persons = await suiviFichenService.getFichesByCoproId(req.params.idCopro);
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

async function getAllFiches(req, res) {
  try {
    const persons = await suiviFichenService.getAllFiches();
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


module.exports = { saveFiches,getInfo,generatePdf, editFiche,getPersonsByInfo, getFichesByCoproId, getAllFiches,countAllPersons };
