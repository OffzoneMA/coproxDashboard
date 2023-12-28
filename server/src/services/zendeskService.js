const axios = require('axios');

require('dotenv').config(); // Load environment variables from .env

const subdomain = process.env.ZENDESK_SUBDOMAIN;
const username = process.env.ZENDESK_USERNAME;
const password = process.env.ZENDESK_PASSWORD;

async function makeRequest(url, errorMessage, { method = 'get', params = {}, body = {} } = {}) {
  try {
    let allData = [];
    let nextPage = url;

    do {
      const link = `https://${subdomain}.zendesk.com/api/v2${nextPage}`;
      console.log(link);
      console.log(`Making ${method.toUpperCase()} request to: ${link}`);

      const response = await axios({
        method: method.toLowerCase(),
        url: link,
        params,
        data: method.toLowerCase() !== 'get' ? body : undefined,
        auth: { username, password },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = response.data;
      // Merge data if 'next_page' exists
      if (responseData.next_page) {
        allData = allData.concat(responseData.users || responseData.organizations || responseData.results || responseData.tickets);
        nextPage = extractNextPage(responseData.next_page);
      } else {
        nextPage = null;
        allData = allData.concat(responseData.users || responseData.user || responseData.organizations || responseData.organization || responseData.results || responseData.tickets|| responseData.ticket || responseData.count);
      }
    } while (nextPage);

    return allData;
  } catch (error) {
    console.error(`${errorMessage}: ${error.message}`);
    throw new Error(`${errorMessage}: ${error.message}`);
  }
}

function extractNextPage(nextPage) {
  if (!nextPage) {
    return null;
  }

  const url = new URL(nextPage);
  let path = url.pathname + url.search;

  // Remove "/api/v2" from the beginning of the path
  path = path.replace(/^\/api\/v2/, '');

  return path.startsWith("/") ? path : `/${path}`;
}

async function addUser(userData) {
  const url = '/users';
  return makeRequest(url, 'Error fetching current user', { method: 'post', body: userData });
}
async function updateUser(userID,userData) {
  const url = `/users/${userID}`;
  return makeRequest(url, 'Error fetching current user', { method: 'put', body: userData });
}


async function getCurrentUser() {
  const url = '/users/me.json';
  return makeRequest(url, 'Error fetching current user');
}

async function getAllUsers() {
  let url = '/users.json';
  return makeRequest(url, 'Error fetching current user');
}

async function getUserFromID(userID) {
  const url = `/users/${userID}.json`;
  return makeRequest(url, 'Error fetching user');
}

async function getUserFromEmail(userEmail) {

  const url = `/users/search.json?query=${`email:${userEmail}`}`;
  return makeRequest(url, 'Error fetching user');
}

async function getAllorganizations() {
  const url = '/organizations.json';
  return makeRequest(url, 'Error fetching All Organizations');
}

async function getTicketsNew() {
  const url = '/tickets.json?status=new';
  return makeRequest(url, 'Error fetching All Ticket with status new');
}

async function updateTicket(ticketId, changes) {
  const url = `/tickets/${ticketId}`;
  return await makeRequest(url, 'Error updating ticket', { method: 'put', body: changes });
}

async function getNonResolvedTicketCount() {
  const url = '/tickets/count.json?status=unresolved';
  return makeRequest(url, 'Error fetching non-resolved ticket count');
}

async function getNonResolvedTicketCountOrganisation(organizationExternalId) {
  try {
    const organizationId = await getOrganizationIdByExternalId(organizationExternalId);
    const url = `/organizations/${organizationId}/tickets.json?status=unresolved&count=true`;
    const response = await makeRequest(url, 'Error fetching non-resolved ticket count');
    const count = response.length || 0;
    return { count };
  } catch (error) {
    console.error(`Error getting non-resolved ticket count for organization: ${error.message}`);
    throw new Error(`Error getting non-resolved ticket count for organization: ${error.message}`);
  }
}

async function getOrganizationIdByExternalId(organizationExternalId) {
  try {
    const url = `/organizations/search?external_id=${organizationExternalId}`;
    const response = await makeRequest(url, 'Error searching for organization by external ID');
    const organization = response[0];

    if (!organization) {
      return null;
    }

    return organization.id;
  } catch (error) {
    console.error(`Error getting organization ID by external ID: ${error.message}`);
    throw new Error(`Error getting organization ID by external ID: ${error.message}`);
  }
}

module.exports = {
  updateTicket,
  updateUser,
  getCurrentUser,
  addUser,
  getAllUsers,
  getUserFromID,
  getUserFromEmail,
  getAllorganizations,
  getTicketsNew,
  getNonResolvedTicketCount,
  getNonResolvedTicketCountOrganisation
};
