const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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


const connection = async () => {
  const coproEndpoint = `/adherant/copro?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}&idAdh=${process.env.VILOGI_IDAUTH}`;

  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
const postAdherant = async () => {
  const coproEndpoint = `/adherant/copro?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}&idAdh=${process.env.VILOGI_IDAUTH}`;

  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
const putAdherant = async () => {
  const coproEndpoint = `/SyndicInfo/copro?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}&idAdh=${process.env.VILOGI_IDAUTH}`;

  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


const getAllCopros = async () => {
  const coproEndpoint = `/SyndicInfo/copro?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
const getCoproData = async (coproID) => {
  const mergedData = {};
  const coproEndpoint1 = `/copro?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  //const coproEndpoint3= `/copro/donneeTechnique?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try {
    const response1 = await axios.get(`${apiUrl}${coproEndpoint1}`);
    await delay(300)
    //const response3 = await axios.get(`${apiUrl}${coproEndpoint3}`);
    Object.assign(mergedData, response1.data);
    //Object.assign(mergedData, response3.data);

    return mergedData;
  } catch (error) {
    throw error;
  }
};
const getCoproDataTech = async (coproID) => {
  const mergedData = {};
  const coproEndpoint3= `/copro/donneeTechnique?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try {
    await delay(300)
    const response3 = await axios.get(`${apiUrl}${coproEndpoint3}`);
    Object.assign(mergedData, response3.data);

    return mergedData;
  } catch (error) {
    throw error;
  }
};

const getCoproTravaux = async (coproID) => {
  const coproEndpoint = `/travaux?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
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


const getCoproManda = async (coproID) => {
  const coproEndpoint = `/mandatSyndic?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getCoproContratAssurance = async (coproID) => {
  const coproEndpoint = `/assurances?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
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
  //const coproEndpoint = `/professionnel/idProfessionnel=${prestaireID}?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  const coproEndpoint = `/professionnel?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  
  try { 
    //console.log(`${apiUrl}${coproEndpoint}`)
    const pros = await axios.get(`${apiUrl}${coproEndpoint}`);
    //console.log(pros.data)
    for(const pro in pros.data){
      //console.log(pros.data[pro])
      if(prestaireID.includes(pros.data[pro].idCompte)){
        //console.log(pros.data[pro])
        return pros.data[pro];
      }
        
    }
  } catch (error) {
    throw error;
  }
};

const getCoproAssemblee = async (coproID) => {
  const adherentsEndpoint = `/adherant/all?token=${process.env.VILOGI_TOKEN}&idAdh=${process.env.VILOGI_IDAUTH}&idCopro=${coproID}`;

  try {
    const response = await axios.get(`${apiUrl}${adherentsEndpoint}`);
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
const getpayementAdherant = async (idAdh,coproID) => {
  const adherentsEndpoint = `/suiviPaiment?token=${process.env.VILOGI_TOKEN}&idAdh=${idAdh}&idCopro=${coproID}`;

  try {
    const response = await axios.get(`${apiUrl}${adherentsEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


module.exports = {
  authenticateUser,
  postAdherant,
  putAdherant,
  getAllCopros,
  getCoproData,
  getCoproDataTech,
  getCoproTravaux,
  getCoproContratAssurance,
  getCoproContratEntretien,
  getCoproContratEntretienFichier,
  getPrestataireById,
  getCoproAssemblee,
  getCoproManda,
  getAllAdherents,
  getpayementAdherant

};
