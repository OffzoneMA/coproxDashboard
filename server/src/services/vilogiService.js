const axios = require('axios');
require('dotenv').config();

const authenticateUser = async () => {
  const apiUrl = 'https://copro.vilogi.com/rest'; // Update with the correct base URL
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

module.exports = {
  authenticateUser,
};