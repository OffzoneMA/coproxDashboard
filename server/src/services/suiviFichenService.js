const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

mongoose.set('useFindAndModify', false);

async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    const result = await callback();
    return result;
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}

function handleMongoError(message, error) {
  console.error(message, error.message);
  throw error;
}

async function addPerson(newPersonData) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const result = await suiviFichenCollection.insertOne(newPersonData);
    return result;
  });
}

async function editPerson(id, updatedPersonData) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const result = await suiviFichenCollection.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: updatedPersonData });
    return result;
  });
}

async function getInfo(id) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('suiviFiche');
    const fiche = await suiviFichenCollection.find({ _id: mongoose.Types.ObjectId(id) }).toArray();;
    return fiche;
  });
}

async function generatePdf(id) {
  try {
    console.log(id);

    // Ensure 'getInfo' is defined and returns a promise
    const data = await getInfo(id);

    console.log(data);

    // Read the HTML template file
    const templatePath = path.join(__dirname, '../utils/modelFicheTemplate.html');
    const template = fs.readFileSync(templatePath, 'utf8');

    // Replace the placeholders in the HTML template string with the data
    const htmlWithData = template
      .replace(/{{name}}/g, data[0]?.nom || '')
      .replace(/{{surname}}/g, data[0]?.prenom || '')
      .replace(/{{address}}/g, data[0]?.adresse || '')
      .replace(/{{postalCode}}/g, data[0]?.codepostale || '')
      .replace(/{{city}}/g, data[0]?.ville || '')
      .replace(/{{qrCode}}/g, ''); // Replace the QR code placeholder with an empty string

    // Create a new PDF document
    const doc = new PDFDocument();

    // Pipe the PDF content to a writable stream
    const writeStream = fs.createWriteStream('output.pdf');
    doc.pipe(writeStream);

    // Add the HTML to the first page of the PDF document
    const page1Options = {
      width: 595.28, // A4 width in points
      height: 841.89, // A4 height in points
    };

    // Split the HTML content into lines and add them to the PDF
    const lines = htmlWithData.split('\n');
    for (const line of lines) {
      doc.text(line, 0, doc.y, { width: 595.28, lineGap: 10 }); // Adjust lineGap as needed
    }

    // Adjust the y-coordinate based on the last line
    const lastLineHeight = lines.length * 10; // Assuming lineGap is 10, adjust as needed
    doc.y += lastLineHeight;

    // Finalize the PDF document
    doc.end();

    // Ensure the stream is closed before resolving
    await new Promise((resolve) => writeStream.on('finish', resolve));

    // Read the generated PDF content into a buffer
    const pdfBuffer = fs.readFileSync('output.pdf');

    // Optionally, you may want to remove the temporary PDF file
    fs.unlinkSync('output.pdf');

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
async function getPersonsByInfo(infoName,infoValue) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const query = {[infoName]: infoValue };
    const persons = await suiviFichenCollection.find(query).toArray();
    return persons;
  });
}

async function getPersonsByCoproId(idCopro) {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const persons = await suiviFichenCollection.find({ idCopro: mongoose.Types.ObjectId(idCopro) }).toArray();
    return persons;
  });
}

async function getAllPersons() {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const persons = await suiviFichenCollection.find({}).toArray();
    return persons;
  });
}

async function countAllPersons() {
  return connectAndExecute(async () => {
    const suiviFichenCollection = MongoDB.getCollection('person');
    const count = await suiviFichenCollection.countDocuments({});
    return count;
  });
}

module.exports = {
  addPerson,
  editPerson,
  getInfo,
  generatePdf,
  getPersonsByInfo,
  getPersonsByCoproId,
  getAllPersons,
  countAllPersons
};