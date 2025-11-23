// vilogiService.js
const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const FormData = require('form-data');
const mime = require('mime-types');
const path = require('path');

// ⬇⬇⬇ add redact to the import ⬇⬇⬇
const { createServiceLogger, redact } = require('./logger');
const { logger, logError } = createServiceLogger('vilogi');

// ... same usage

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

const apiUrl = 'https://copro.vilogi.com/rest';

// —— Axios instance with wisdom logging ——
const axiosInstance = axios.create({ baseURL: apiUrl, timeout: 120000 });

// request timing + redacted logging
axiosInstance.interceptors.request.use(config => {
  config.metadata = { start: Date.now() };

  // avoid logging huge headers objects + redact auth
  const safeHeaders = {};
  if (config.headers && typeof config.headers === 'object') {
    for (const [k, v] of Object.entries(config.headers)) {
      safeHeaders[k] = k.toLowerCase() === 'authorization' ? '[REDACTED]' : v;
    }
  }

  logger.debug('HTTP request', {
    meta: {
      method: config.method,
      url: redact((config.baseURL || '') + (config.url || '')),
      headers: safeHeaders,
      hasData: !!config.data
    }
  });
  return config;
});

// response timing + outcome
axiosInstance.interceptors.response.use(
  res => {
    const ms = Date.now() - (res.config.metadata?.start || Date.now());
    logger.info('HTTP success', {
      meta: {
        status: res.status,
        url: redact((res.config.baseURL || '') + (res.config.url || '')),
        duration_ms: ms
      }
    });
    return res;
  },
  err => {
    const cfg = err.config || {};
    const ms = Date.now() - (cfg.metadata?.start || Date.now());
    logError(err, 'HTTP error', {
      url: redact((cfg.baseURL || '') + (cfg.url || '')),
      duration_ms: ms,
      method: cfg.method
    });
    return Promise.reject(err);
  }
);

// ------------- AUTH -------------
const authenticateUser = async (loginData, pwdData) => {
  const url = `/connexionMulti?token=${process.env.VILOGI_TOKEN}`;
  try {
    logger.info('Authenticating user');
    const response = await axiosInstance.post(url, { login: loginData, pwd: pwdData });
    return response.data;
  } catch (error) {
    logError(error, 'Error authenticating user');
    throw error;
  }
};

// ------------- BASIC CALLS -------------
const connection = async () => {
  const url = `/adherant/copro?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    logger.info('Fetching connection data');
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) { logError(error, 'connection() failed'); throw error; }
};

const postAdherant = async () => {
  const url = `/adherant/copro?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    logger.info('postAdherant');
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) { logError(error, 'postAdherant() failed'); throw error; }
};

const putAdherant = async () => {
  const url = `/SyndicInfo/copro?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    logger.info('putAdherant');
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) { logError(error, 'putAdherant() failed'); throw error; }
};

const getAllCopros = async () => {
  const url = `/SyndicInfo/copro?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    logger.info('getAllCopros');
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) { logError(error, 'getAllCopros() failed'); throw error; }
};

// ------------- COMPOSITES -------------
const getCoproData = async (coproID) => {
  const mergedData = {};
  const url1 = `/copro?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  const url3 = `/copro/info?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try {
    logger.info('getCoproData start', { meta: { coproID } });
    const response1 = await axiosInstance.get(url1);
    await delay(300);
    const response3 = await axiosInstance.get(url3);
    Object.assign(mergedData, response1.data, response3.data);
    return mergedData;
  } catch (error) { logError(error, 'getCoproData() failed', { coproID }); throw error; }
};

const countConenction = async () => {
  const url = `/callApi?token=${process.env.VILOGI_TOKEN}&idCopro=${process.env.VILOGI_IDCOPROEXEMPLE}`;
  try {
    logger.info('countConenction');
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) { logError(error, 'countConenction() failed'); throw error; }
};

const getCoproDataTech = async (coproID) => {
  const mergedData = {};
  const urlTech = `/copro/donneeTechnique?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  const urlInfo = `/copro/info?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;

  try {
    logger.info('getCoproDataTech start', { meta: { coproID } });
    await delay(300);
    const [techResponse, infoResponse] = await Promise.all([
      axiosInstance.get(urlTech),
      axiosInstance.get(urlInfo)
    ]);
    Object.assign(mergedData, techResponse.data, infoResponse.data);
    return mergedData;
  } catch (error) { logError(error, 'getCoproDataTech() failed', { coproID }); throw error; }
};

// ------------- SIMPLE FORWARDS -------------
const getCoproTravaux = async (coproID) => {
  const url = `/travaux?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try { logger.info('getCoproTravaux', { meta: { coproID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getCoproTravaux() failed', { coproID }); throw e; }
};

const getCoproContratEntretien = async (coproID) => {
  const url = `/contratEntretien?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try { logger.info('getCoproContratEntretien', { meta: { coproID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getCoproContratEntretien() failed', { coproID }); throw e; }
};

const getCoproManda = async (coproID) => {
  const url = `/mandatSyndic?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try { logger.info('getCoproManda', { meta: { coproID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getCoproManda() failed', { coproID }); throw e; }
};

const getCoproExercice = async (coproID) => {
  const url = `/exercice?token=${process.env.VILOGI_TOKEN}&copro=${coproID}`;
  try { logger.info('getCoproExercice', { meta: { coproID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getCoproExercice() failed', { coproID }); throw e; }
};

const getRapprochemetBancaire = async (coproID) => {
  const url = `/rapprochements?token=${process.env.VILOGI_TOKEN}&copro=${coproID}`;
  try { logger.info('getRapprochemetBancaire', { meta: { coproID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getRapprochemetBancaire() failed', { coproID }); throw e; }
};

const getbudgetComptebyDate = async (coproID, compte, date) => {
  const url = `/andecriture/soldeBalance?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&compte=${compte}&dateSolde=${date}`;
  try { logger.info('getbudgetComptebyDate', { meta: { coproID, compte, date } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getbudgetComptebyDate() failed', { coproID, compte }); throw e; }
};

const getbudgetCopro = async (coproID, exerciceID) => {
  const url = `/budgets?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&exercice=${exerciceID}`;
  try { logger.info('getbudgetCopro', { meta: { coproID, exerciceID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getbudgetCopro() failed', { coproID, exerciceID }); throw e; }
};

const getecritureComptableCompte = async (coproID, compte) => {
  const url = `/andecriture/list?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&withCompte=${compte}`;
  try { logger.info('getecritureComptableCompte', { meta: { coproID, compte} }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getecritureComptableCompte() failed', { coproID, compte }); throw e; }
};

const getCoproContratAssurance = async (coproID) => {
  const url = `/assurances?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try { logger.info('getCoproContratAssurance', { meta: { coproID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getCoproContratAssurance() failed', { coproID }); throw e; }
};

// file download (stream) with logging
const getCoproContratEntretienFichier = async (fichierID, coproID, outputFileName) => {
  const url = `/contratEntretien/getFile/${fichierID}?token=${process.env.VILOGI_TOKEN}&idCopro=${coproID}&idAdh=${process.env.VILOGI_IDAUTH}`;
  try {
    logger.info('Downloading contrat entretien file', { meta: { fichierID, coproID, outputFileName } });
    const response = await axiosInstance.get(url, { responseType: 'stream' });

    const outputDir = path.dirname(outputFileName);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const writer = fs.createWriteStream(outputFileName);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', err => { fs.unlink(outputFileName, () => reject(err)); });
    });

    logger.info('File downloaded', { meta: { outputFileName } });
  } catch (error) {
    logError(error, 'getCoproContratEntretienFichier() failed', { fichierID, coproID, outputFileName });
    throw error;
  }
};

// ------------- PRESTATAIRES -------------
const getPrestataires = async (coproID) => {
  const url = `/professionnel?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try {
    logger.info('getPrestataires', { meta: { coproID } });
    const pros = await axiosInstance.get(url);
    return pros.data;
  } catch (error) { logError(error, 'getPrestataires() failed', { coproID }); throw error; }
};

const getPrestataireById = async (prestaireID, coproID) => {
  const url = `/professionnel?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
  try {
    logger.info('getPrestataireById', { meta: { coproID, prestaireID } });
    const pros = await axiosInstance.get(url);
    for (const idx in pros.data) {
      if (prestaireID.includes(pros.data[idx].idCompte)) {
        return pros.data[idx];
      }
    }
    return null;
  } catch (error) { logError(error, 'getPrestataireById() failed', { coproID, prestaireID }); throw error; }
};

// ------------- ASSEMBLÉES / ADHÉRENTS -------------
const getCoproAssemblee = async (coproID, assembleID) => {
  const url = `/assemblee?token=${process.env.VILOGI_TOKEN}&idAdh=${process.env.VILOGI_IDAUTH}&idCopro=${coproID}`;
  try {
    logger.info('getCoproAssemblee', { meta: { coproID, assembleID } });
    const response = await axiosInstance.get(url);
    const data = Array.isArray(response.data) ? response.data : [];
    return data.find(a => a.id === assembleID) || null;
  } catch (error) { logError(error, 'getCoproAssemblee() failed', { coproID, assembleID }); throw error; }
};

const getAdherent = async (coproID, adherantID) => {
  const url = `/adherant/${adherantID}?token=${process.env.VILOGI_TOKEN}&idAdh=${process.env.VILOGI_IDAUTH}&idCopro=${coproID}`;
  try { logger.info('getAdherent', { meta: { coproID, adherantID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getAdherent() failed', { coproID, adherantID }); throw e; }
};

const getAllAdherents = async (coproID) => {
  const url = `/adherant/all?token=${process.env.VILOGI_TOKEN}&idAdh=${process.env.VILOGI_IDAUTH}&idCopro=${coproID}`;
  try { logger.info('getAllAdherents', { meta: { coproID } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getAllAdherents() failed', { coproID }); throw e; }
};

const getpayementAdherant = async (idAdh, coproID) => {
  const url = `/suiviPaiment?token=${process.env.VILOGI_TOKEN}&idAdh=${idAdh}&idCopro=${coproID}`;
  try { logger.info('getpayementAdherant', { meta: { coproID, idAdh } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getpayementAdherant() failed', { coproID, idAdh }); throw e; }
};

const getRelanceAdherant = async (idAdh, coproID) => {
  const url = `/relances?token=${process.env.VILOGI_TOKEN}&idAdherant=${idAdh}&copro=${coproID}`;
  try { logger.info('getRelanceAdherant', { meta: { coproID, idAdh } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getRelanceAdherant() failed', { coproID, idAdh }); throw e; }
};

const getUserHasMessage = async (idAdh, coproID) => {
  const url = `/odsmessage?token=${process.env.VILOGI_TOKEN}&idAdh=${idAdh}&idCopro=${coproID}`;
  try { logger.info('getUserHasMessage', { meta: { coproID, idAdh } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getUserHasMessage() failed', { coproID, idAdh }); throw e; }
};

const getUserMessagePushLu = async (idMessage, idAdh, coproID) => {
  const url = `/odsmessage/setLu?token=${process.env.VILOGI_TOKEN}&idAdh=${idAdh}&idCopro=${coproID}&idEvent=${idMessage}`;
  try { logger.info('getUserMessagePushLu', { meta: { coproID, idAdh, idMessage } }); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getUserMessagePushLu() failed', { coproID, idAdh, idMessage }); throw e; }
};

// ------------- OCR -------------
const sendFactureToOCR = async (coproID, filePath) => {
  const url = `/FichierOCR?token=${process.env.VILOGI_TOKEN}&id=${process.env.VILOGI_IDAUTH}&copro=${coproID}&idSyndic=${process.env.VILOGI_idSyndic}`;

  if (!fs.existsSync(filePath)) {
    const err = new Error(`File not found at path: ${filePath}`);
    logError(err, 'sendFactureToOCR() local file missing', { filePath });
    throw err;
  }

  const formData = new FormData();
  formData.append('fichier', fs.createReadStream(filePath));

  try {
    logger.info('sendFactureToOCR start', { meta: { coproID, filePath } });
    const response = await axiosInstance.put(url, formData, { headers: formData.getHeaders() });
    logger.info('sendFactureToOCR success');
    return response.data;
  } catch (error) {
    logError(error, 'sendFactureToOCR() failed', { coproID, filePath });
    throw error;
  }
};

const getFactureOCRBrouillon = async () => {
  const url = `/FichierOCR/all?token=${process.env.VILOGI_TOKEN}&id=${process.env.VILOGI_IDAUTH}&copro=${process.env.VILOGI_IDCOPROEXEMPLE}&idSyndic=${process.env.VILOGI_idSyndic}`;
  try { logger.info('getFactureOCRBrouillon'); const r = await axiosInstance.get(url); return r.data; }
  catch (e) { logError(e, 'getFactureOCRBrouillon() failed'); throw e; }
};

/**
 * Check if a copro still exists in Vilogi system
 * @param {string} coproID - The Vilogi copro ID to check
 * @returns {Object} - { exists: boolean, status: string, error: string|null }
 */
const checkCoproExistsInVilogi = async (coproID) => {
  try {
    logger.info('Checking if copro exists in Vilogi', { meta: { coproID } });
    
    // Try to fetch basic copro data - if it exists, this should succeed
    const url = `/copro?token=${process.env.VILOGI_TOKEN}&copro=${coproID}&id=${process.env.VILOGI_IDAUTH}`;
    const response = await axiosInstance.get(url);
    
    // If we get data back, the copro exists
    if (response.data && response.status === 200) {
      logger.info('Copro exists in Vilogi', { meta: { coproID } });
      return { exists: true, status: 'active', error: null };
    }
    
    return { exists: false, status: 'not_in_vilogi', error: 'No data returned' };
  } catch (error) {
    // Check if it's a 404 or similar "not found" error
    if (error.response) {
      if (error.response.status === 404) {
        logger.warn('Copro not found in Vilogi (404)', { meta: { coproID } });
        return { exists: false, status: 'not_in_vilogi', error: 'Not found in Vilogi' };
      } else if (error.response.status === 403 || error.response.status === 401) {
        logger.warn('Access denied for copro', { meta: { coproID, status: error.response.status } });
        return { exists: false, status: 'not_in_vilogi', error: 'Access denied - copro may have been removed' };
      }
    }
    
    // For other errors, mark as API error but don't definitively say it doesn't exist
    logError(error, 'Error checking copro existence', { coproID });
    return { 
      exists: false, 
      status: 'api_error', 
      error: error.message || 'API error during validation'
    };
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
  checkCoproExistsInVilogi
};
