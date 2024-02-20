const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiUrl = 'https://copro.vilogi.com/rest'; // Update with the correct base URL

const authenticateUser = async () => {
  const loginEndpoint = '/connexionMulti'; // Update with the correct login endpoint

  try {
    const response = await axios.post(`${apiUrl}${loginEndpoint}?token=${process.env.VILOGI_TOKEN}`, {
      login: process.env.VILOGI_USERNAME,
      pwd: process.env.VILOGI_PASSWORD,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getCoproData = async (coproID) => {
  const coproEndpoint = `/copro?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;

  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getCoproContratEntretien = async (coproID) => {
  const coproEndpoint = `/contratEntretien?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getCoproContratEntretienFichier = async (fichierID,coproID,outputFileName) => {

  const coproEndpoint = `/contratEntretien/getFile/${fichierID}?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    const response = await axios({
      method: 'get',
      url: `${apiUrl}${coproEndpoint}`,
      responseType: 'stream',
    });    

    // Pipe the response stream to a file
    response.data.pipe(fs.createWriteStream(outputFileName));

    // Wait for the file to be fully written
    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });

    console.log('File downloaded successfully:', outputFileName);
  } catch (error) {
    console.error('Error downloading file:', error.message);
  }
};

const getPrestataireById = async (prestaireID,coproID) => {
  const coproEndpoint = `/professionnel?idProfessionnel=${prestaireID}&token=${process.env.VILOGI_TOKEN}&Copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


const getAllAdherents = async (coproID) => {
  const adherentsEndpoint = `/adherant/all?token=${process.env.VILOGI_TOKEN}&idAdh=${process.env.VILOGI_IDAUTH}&idCopro=${coproID}`;

  try {
    const response = await axios.get(`${apiUrl}${adherentsEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateUser,
  getCoproData,
  getCoproContratEntretien,
  getCoproContratEntretienFichier,
  getPrestataireById,
  getAllAdherents,
};
