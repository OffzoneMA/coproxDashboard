 // mondayService.js

const axios = require('axios');
const qs = require('querystring');

const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_AUTH_URL = 'https://auth.monday.com/oauth2/authorize';

// Replace with your actual client ID and client secret
const CLIENT_ID = process.env.MONDAY_CLIENT_ID;
const CLIENT_SECRET = process.env.hahaha;

// Function to obtain an access token using OAuth 2.0 authorization code flow
async function getAccessToken(authorizationCode, redirectUri) {
  try {
    const response = await axios.post('https://auth.monday.com/oauth2/token', qs.stringify({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: authorizationCode,
      redirect_uri: redirectUri,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data.access_token;
  } catch (error) {
    throw new Error('Error obtaining access token:', error.response ? error.response.data : error.message);
  }
}

// Set up Axios instance with authentication headers
function createMondayAPIInstance(accessToken) {
  return axios.create({
    baseURL: MONDAY_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
}

// Function to get all items in a board
async function getItems(boardId, accessToken) {
  try {
    const mondayAPI = createMondayAPIInstance(accessToken);
    const response = await mondayAPI.post('/', {
      query: `
        query {
          boards (ids: [${boardId}]) {
            items {
              id
              name
            }
          }
        }
      `,
    });

    return response.data.data.boards[0].items;
  } catch (error) {
    throw new Error('Error fetching items:', error.response ? error.response.data : error.message);
  }
}

// Function to create a new item in a board
async function createItem(boardId, itemName, accessToken) {
  try {
    const mondayAPI = createMondayAPIInstance(accessToken);
    const response = await mondayAPI.post('/', {
      query: `
        mutation {
          create_item (board_id: ${boardId}, item_name: "${itemName}") {
            id
            name
          }
        }
      `,
    });

    return response.data.data.create_item;
  } catch (error) {
    throw new Error('Error creating item:', error.response ? error.response.data : error.message);
  }
}

// Function to create a subitem under a parent item
async function createSubitem(parentItemId, subitemName, accessToken) {
  try {
    const mondayAPI = createMondayAPIInstance(accessToken);
    const response = await mondayAPI.post('/', {
      query: `
        mutation {
          create_subitem (parent_item_id: ${parentItemId}, item_name: "${subitemName}") {
            id
            name
          }
        }
      `,
    });

    return response.data.data.create_subitem;
  } catch (error) {
    throw new Error('Error creating subitem:', error.response ? error.response.data : error.message);
  }
}

module.exports = {
  getAccessToken,
  getItems,
  createItem,
  createSubitem,
};
