const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const FormData = require('form-data');
const mime = require('mime-types');
const path = require('path');
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const apiUrl = 'https://copro.vilogi.com/rest'; // Update with the correct base URL

const authenticateUser = async (loginData,pwdData) => {
  const loginEndpoint = '/connexionMulti'; // Update with the correct login endpoint
  try {
    const response = await axios.post(`${apiUrl}${loginEndpoint}?token=${process.env.VILOGI_TOKEN}`, {
      login: loginData,
      pwd: pwdData,
    });
    return response.data;
  } catch (error) {
    console.error('Error authenticating user:', error.message);
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
const countConenction = async () => {
  const coproEndpoint = `/callApi?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}`;

  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
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
const getCoproExercice = async (coproID) => {
  const coproEndpoint = `/exercice?token=${process.env.VILOGI_TOKEN}&copro=${coproID}`;
  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


const getRapprochemetBancaire = async (coproID) => {
  const coproEndpoint = `/rapprochements?token=${process.env.VILOGI_TOKEN}&copro=${coproID}`;
  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getbudgetComptebyDate = async (coproID,compte,date) => {
  const coproEndpoint = `/andecriture/soldeBalance?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&compte=${compte}&dateSolde=${date}`;
  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getbudgetCopro = async (coproID,exerciceID) => {
  const coproEndpoint = `/budgets?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&exercice=${exerciceID}`;
  try {
    const response = await axios.get(`${apiUrl}${coproEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getecritureComptableCompte = async (coproID,compte) => {
  const coproEndpoint = `/andecriture/list?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&withCompte=${compte}`;
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
const getCoproContratEntretienFichier = async (fichierID, coproID, outputFileName) => {
  const coproEndpoint = `/contratEntretien/getFile/${fichierID}?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    const response = await axios({
      method: 'get',
      url: `${apiUrl}${coproEndpoint}`,
      responseType: 'stream',
    });

    // Ensure the directory exists
    const outputDir = path.dirname(outputFileName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const writer = fs.createWriteStream(outputFileName);
    // Pipe the response stream to a file
    response.data.pipe(writer);

    // Wait for the file to be fully written
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve); // Resolve the promise when the stream finishes
      writer.on('error', (err) => {
        // Delete the file if an error occurs and reject the promise
        fs.unlink(outputFileName, () => reject(err));
      });
    });

    console.log('File downloaded successfully:', outputFileName);
  } catch (error) {
    console.error('Error downloading file:', error.message);
  }
};


const getPrestataires = async (coproID) => {
  const coproEndpoint = `/professionnel?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try { 
    //console.log(`${apiUrl}${coproEndpoint}`)
    const pros = await axios.get(`${apiUrl}${coproEndpoint}`);
    return pros.data;
  } catch (error) {
    throw error;
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

const getAdherent = async (coproID,adherantID) => {
  const adherentsEndpoint = `/adherant/${adherantID}?token=${process.env.VILOGI_TOKEN}&idAdh=${process.env.VILOGI_IDAUTH}&idCopro=${coproID}`;

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
const getRelanceAdherant = async (idAdh,coproID) => {
  const adherentsEndpoint = `/relances?token=${process.env.VILOGI_TOKEN}&idAdherant=${idAdh}&copro=${coproID}`;

  try {
    const response = await axios.get(`${apiUrl}${adherentsEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
const getUserHasMessage = async (idAdh,coproID) => {
  const adherentsEndpoint = `/odsmessage?token=${process.env.VILOGI_TOKEN}&idAdh=${idAdh}&idCopro=${coproID}`;

  try {
    const response = await axios.get(`${apiUrl}${adherentsEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getUserMessagePushLu = async (idMessage,idAdh,coproID) => {
  const adherentsEndpoint = `/odsmessage/setLu?token=${process.env.VILOGI_TOKEN}&idAdh=${idAdh}&idCopro=${coproID}&idEvent=${idMessage}`;
  try {
    const response = await axios.get(`${apiUrl}${adherentsEndpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/*
axios.interceptors.request.use(request => {
  console.log('Request Details:');
  console.log(`URL: ${request.url}`);
  console.log(`Method: ${request.method}`);
  console.log(`Headers:`, request.headers);
  if (request.data) {
    console.log(`Data:`, request.data); // For FormData, this may not be fully visible
  }
  return request; // Important to return the request so Axios can continue with it
});*/

const sendFactureToOCR = async (coproID, filePath) => {
  // Construct the endpoint
  const adherentsEndpoint = `/FichierOCR?token=${process.env.VILOGI_TOKEN}&id=${process.env.VILOGI_IDAUTH}&copro=${coproID}&idSyndic=${process.env.VILOGI_idSyndic}`;

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const formData = new FormData();
  formData.append('fichier', fs.createReadStream(filePath));
  
  console.log(`Sending request to: ${apiUrl}${adherentsEndpoint}`);

  try {
    console.log(`${apiUrl}${adherentsEndpoint}`)
    const response = await axios.put(`${apiUrl}${adherentsEndpoint}`, formData, {
      headers: formData.getHeaders(),
    });

    console.log('OCR Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending file to OCR:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const getFactureOCRBrouillon = async () => {
  const adherentsEndpoint = `/FichierOCR/all?token=${process.env.VILOGI_TOKEN}&id=${process.env.VILOGI_IDAUTH}&copro=${process.env.VILOGI_IDCOPROEXEMPLE}&idSyndic=${process.env.VILOGI_idSyndic}`;
  try {
    const response = await axios.get(`${apiUrl}${adherentsEndpoint}`);
    return response.data;
  } catch (error) {
    throw error; throw error;
  }
};

const getProprietaireInfo = async (proprietaireID) => {
  const endpoint = `/proprietaires/${proprietaireID}?token=${process.env.VILOGI_TOKEN}`;
  try {
    const response = await axios.get(`${apiUrl}${endpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProprietaireLots = async (proprietaireID) => {
  const endpoint = `/proprietaires/${proprietaireID}/lots?token=${process.env.VILOGI_TOKEN}`;
  try {
    const response = await axios.get(`${apiUrl}${endpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProprietaireComptes = async (proprietaireID) => {
  const endpoint = `/proprietaires/${proprietaireID}/comptes?token=${process.env.VILOGI_TOKEN}`;
  try {
    const response = await axios.get(`${apiUrl}${endpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProprietaireDocuments = async (proprietaireID) => {
  const endpoint = `/proprietaires/${proprietaireID}/documents?token=${process.env.VILOGI_TOKEN}`;
  try {
    const response = await axios.get(`${apiUrl}${endpoint}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateUser,
  countConenction,
  postAdherant,
  putAdherant,
  getAllCopros,
  getCoproData,
  getCoproDataTech,
  getCoproTravaux,
  getCoproExercice,
  getecritureComptableCompte,
  getRapprochemetBancaire,
  getCoproContratAssurance,
  getCoproContratEntretien,
  getCoproContratEntretienFichier,
  getbudgetComptebyDate,
  getbudgetCopro,
  getPrestataires,
  getPrestataireById,
  getCoproAssemblee,
  getCoproManda,
  getAdherent,
  getAllAdherents,
  getpayementAdherant,
  getRelanceAdherant,
  getUserHasMessage,
  getUserMessagePushLu,
  sendFactureToOCR,
  getFactureOCRBrouillon,
  getProprietaireInfo,
  getProprietaireLots,
  getProprietaireComptes,
  getProprietaireDocuments
};
