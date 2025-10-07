const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env
const { createServiceLogger, redact } = require('./logger');
const { logger, logError } = createServiceLogger('zendesk');

const subdomain = process.env.ZENDESK_SUBDOMAIN;
const username = process.env.ZENDESK_USERNAME;
const password = process.env.ZENDESK_PASSWORD;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(
  url,
  errorMessage,
  { method = 'get', params = {}, body = {} } = {}
) {
  try {
    let allData = [];
    let nextPage = url;

    do {
      await delay(300);
      const link = `https://${subdomain}.zendesk.com/api/v2${nextPage}`;
      logger.debug('Zendesk request', { meta: { method: method.toUpperCase(), url: redact(link) } });

      const response = await axios({
        method: method.toLowerCase(),
        url: link,
        params,
        data: method.toLowerCase() !== 'get' ? body : undefined,
        auth: { username, password },
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = response.data;

      if (responseData.next_page) {
        allData = allData.concat(
          responseData.users ||
          responseData.organizations ||
          responseData.organization_fields ||
          responseData.results ||
          responseData.tickets ||
          responseData.comments ||
          responseData.suspended_tickets
        );
        nextPage = extractNextPage(responseData.next_page);
      } else {
        nextPage = null;
        allData = allData.concat(
          responseData.users ||
          responseData.user ||
          responseData.organizations ||
          responseData.organization ||
          responseData.organization_fields ||
          responseData.results ||
          responseData.tickets ||
          responseData.comments ||
          responseData.comment ||
          responseData.suspended_tickets ||
          responseData.ticket ||
          responseData.count
        );
      }
    } while (nextPage);
    logger.info('Zendesk request success', { meta: { count: Array.isArray(allData) ? allData.length : 1 } });
    return allData;
  } catch (error) {
    const responseError = {
      data: error.response ? error.response.data : null,
      status: error.response ? error.response.status : null,
      statusText: error.response ? error.response.statusText : null,
    };

    const messages = flattenJSON(responseError.data);
    const requestBody = error.config ? error.config.data : null;

    logError(error, errorMessage, {
      status: responseError.status,
      statusText: responseError.statusText,
      messages,
    });
    throw new Error(`${errorMessage}: Response data: ${messages}`);
  }
}

function extractNextPage(nextPage) {
  if (!nextPage) return null;

  const url = new URL(nextPage);
  let path = url.pathname + url.search;

  // Remove "/api/v2" from the beginning of the path
  path = path.replace(/^\/api\/v2/, '');
  return path.startsWith('/') ? path : `/${path}`;
}

function flattenJSON(obj, separatorKey = '--', separatorValue = ':') {
  const result = [];

  function traverse(o, parentKey = '') {
    for (const key in o) {
      const currentKey = parentKey ? `${parentKey}${separatorKey}${key}` : key;
      if (typeof o[key] === 'object' && o[key] !== null) {
        traverse(o[key], currentKey);
      } else {
        result.push(`${currentKey}${separatorValue}${o[key]}`);
      }
    }
  }

  traverse(obj);
  return result;
}

// -------------------- USER FUNCTIONS --------------------
async function addUser(userData) {
  const url = '/users';
  const response = await makeRequest(url, 'Error adding user', {
    method: 'post',
    body: userData,
  });
  logger.info('Zendesk user added', { meta: { id: response[0]?.id } });
  return response[0].id;
}

async function updateUser(userID, userData) {
  const url = `/users/${userID}`;
  return makeRequest(url, 'Error updating user', {
    method: 'put',
    body: userData,
  });
}

async function getCurrentUser() {
  const url = '/users/me.json';
  return makeRequest(url, 'Error fetching current user');
}

async function getAllUsers() {
  const url = '/users.json';
  return makeRequest(url, 'Error fetching all users');
}

async function getUserFromID(userID) {
  const url = `/users/${userID}.json`;
  return makeRequest(url, 'Error fetching user by ID');
}

async function getUserFromEmail(userEmail) {
  const url = `/users/search.json?query=${`email:${userEmail}`}`;
  const user = await makeRequest(url, 'Error fetching user by email');
  return { id: user[0]?.id } || {};
}

async function getUsersByOrg(orgID) {
  const url = `/organizations/${orgID}/users`;
  return makeRequest(url, 'Error fetching users by organization');
}

// -------------------- ORGANIZATION FUNCTIONS --------------------
async function addOrganization(organizationData) {
  const url = '/organizations.json';
  const jsonObject = { organization: organizationData };
  const response = await makeRequest(url, 'Error adding organization', {
    method: 'post',
    body: jsonObject,
  });
  logger.info('Zendesk organization added', { meta: { id: response?.id } });
  return response.id;
}

async function updateOrganization(organizationID, organizationData) {
  const url = `/organizations/${organizationID}.json`;
  return makeRequest(url, 'Error updating organization', {
    method: 'put',
    body: organizationData,
  });
}

async function getAllOrganizations() {
  const url = '/organizations.json';
  return makeRequest(url, 'Error fetching all organizations');
}

async function getOrganizationsById(organizationID) {
  const url = `/organizations/${organizationID}.json`;
  return makeRequest(url, 'Error fetching organization by ID');
}

async function getOrganizationFields() {
  const url = '/organization_fields.json';
  return makeRequest(url, 'Error fetching organization fields');
}

async function getOrganizationIdByExternalId(organizationExternalId) {
  const url = `/organizations/search?external_id=${organizationExternalId}`;
  const response = await makeRequest(
    url,
    'Error searching for organization by external ID'
  );
  const organization = response[0];
  return organization ? organization.id : null;
}

// -------------------- TICKET FUNCTIONS --------------------
async function createTicket(ticketData) {
  const url = '/tickets.json';
  return makeRequest(url, 'Error creating new ticket', {
    method: 'post',
    body: ticketData,
  });
}

async function addMessageToTicket(ticketId, ticket) {
  const url = `/tickets/${ticketId}/comments.json`;
  return makeRequest(url, 'Error adding message to ticket', {
    method: 'post',
    body: ticket,
  });
}

async function updateTicket(ticketId, ticketData) {
  const url = `/tickets/${ticketId}`;
  return makeRequest(url, 'Error updating ticket', {
    method: 'put',
    body: ticketData,
  });
}

async function getTicketsByStatus(ticketStatus) {
  const url = `/search.json?query=custom_status_id:${ticketStatus}`;
  return makeRequest(url, 'Error fetching tickets by status');
}

async function getTicketsNew() {
  const today = new Date(Date.now() - 24 * 60 * 60 * 1000) // yesterday
    .toISOString()
    .slice(0, 10);

  const url = `/search.json?query=created<=${today} status:open status:new&sort_by=created_at&sort_order=desc`;

  try {
    const tickets = await makeRequest(url, 'Error fetching new tickets');
    if (!Array.isArray(tickets)) {
      logger.warn('No valid ticket array returned', { meta: { type: typeof tickets } });
      return [];
    }
    return tickets;
  } catch (err) {
    logError(err, 'getTicketsNew failed');
    return [];
  }
}

async function getTicketsOld() {
  const d = new Date();
  d.setMonth(d.getMonth() - 17);
  d.setDate(d.getDate() - 15);
  const oneYearAgo = d.toISOString().slice(0, 10);
  const url = `/search.json?query=solved<=${oneYearAgo}&status:solved:new&has_attachment:true&sort_by=update_at&sort_order=desc`;
  return makeRequest(url, 'Error fetching old tickets');
}

async function getTicketsNotClosed() {
  const url =
    '/search.json?query=status:open+status:new+status:pending+status:resolved&sort_by=created_at&sort_order=desc';
  return makeRequest(url, 'Error fetching not closed tickets');
}

async function getTicketsNewAssigned() {
  const url =
    '/search.json?query=assignee%3A*+status%3Aopen&sort_by=created_at&sort_order=desc';
  return makeRequest(url, 'Error fetching newly assigned tickets');
}

async function ticketsNotAssigned(){
  const url =
    '/search.json?query=type:ticket%20assignee:none';//assigned to nobody
  return makeRequest(url, 'Error fetching newly assigned tickets');
}

async function getTicketsByUser(userID) {
  const url = `/users/${userID}/tickets/requested`;
  return makeRequest(url, 'Error fetching tickets by user');
}

async function getTicketsById(ticketID) {
  const url = `/tickets/${ticketID}.json`;
  return makeRequest(url, 'Error fetching ticket by ID');
}

async function getTicketsComments(ticketID) {
  const url = `/tickets/${ticketID}/comments`;
  return makeRequest(url, 'Error fetching ticket comments');
}

async function redactCommentAttachment(ticketId, commentId, attachmentId) {
  const url = `/tickets/${ticketId}/comments/${commentId}/attachments/${attachmentId}/redact.json`;
  return makeRequest(url, 'Error redacting ticket attachment', {
    method: 'put',
  });
}

async function getNonResolvedTicketCount() {
  const url = '/search.json?query=status<solved%20status<closed';
  const response = await makeRequest(
    url,
    'Error fetching non-resolved ticket count'
  );
  return response.length || 0;
}

async function getNonResolvedTicketCountOrganisation(organizationExternalId) {
  try {
    const organizationId = await getOrganizationIdByExternalId(
      organizationExternalId
    );
    const url = `/search.json?query=status<solved%20status<closed%20organization:${organizationId}`;
    const response = await makeRequest(
      url,
      'Error fetching non-resolved ticket count'
    );
    return { count: response.length || 0 };
  } catch (error) {
    logError(error, 'Error getting non-resolved ticket count for organization', { organizationExternalId });
    throw error;
  }
}

// -------------------- SUSPENDED TICKETS --------------------
async function getSuspendedTickets() {
  const url = '/suspended_tickets';
  return makeRequest(url, 'Error fetching suspended tickets');
}

async function recoverTicket(ticketId) {
  const url = `/suspended_tickets/${ticketId}`;
  return makeRequest(url, 'Error recovering ticket', { method: 'get' });
}

async function recoverAllSuspendedTickets() {
  try {
    const suspendedTickets = await getSuspendedTickets();
    for (const ticket of suspendedTickets) {
      logger.info('Recovering suspended ticket', { meta: { id: ticket.id } });
      await recoverTicket(ticket.id);
    }
    logger.info('All suspended tickets have been recovered.');
  } catch (error) {
    logError(error, 'Error recovering suspended tickets');
    throw error;
  }
}

// -------------------- EXPORTS --------------------
module.exports = {
  updateTicket,
  updateUser,
  getCurrentUser,
  addUser,
  addOrganization,
  updateOrganization,
  getAllUsers,
  getUserFromID,
  getUserFromEmail,
  getUsersByOrg,
  getAllOrganizations,
  getOrganizationsById,
  getOrganizationFields,
  createTicket,
  addMessageToTicket,
  getTicketsNew,
  getTicketsOld,
  getTicketsByStatus,
  getTicketsNotClosed,
  getTicketsNewAssigned,
  ticketsNotAssigned,
  getTicketsByUser,
  getTicketsById,
  getTicketsComments,
  redactCommentAttachment,
  getNonResolvedTicketCount,
  recoverAllSuspendedTickets,
  getNonResolvedTicketCountOrganisation,
};