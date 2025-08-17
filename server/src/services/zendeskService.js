const axios = require('axios');

require('dotenv').config(); // Load environment variables from .env

const subdomain = process.env.ZENDESK_SUBDOMAIN;
const username = process.env.ZENDESK_USERNAME;
const password = process.env.ZENDESK_PASSWORD;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, errorMessage, { method = 'get', params = {}, body = {} } = {}) {
  try {
    let allData = [];
    let nextPage = url;

    do {
      await delay(300)
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
        allData = allData.concat(responseData.users || responseData.organizations || responseData.results || responseData.tickets || responseData.comments || responseData.suspended_tickets) ;
        nextPage = extractNextPage(responseData.next_page);

      } else {
 
        nextPage = null;
        allData = allData.concat(responseData.users || responseData.user || responseData.organizations || responseData.organization || responseData.results || responseData.tickets|| responseData.comments || responseData.comment ||  responseData.suspended_tickets || responseData.ticket ||  responseData.count );
      }
    } while (nextPage);

    return allData;
  } catch (error) {
    const responseError = {
      data: error.response ? error.response.data : null,
      status: error.response ? error.response.status : null,
      statusText: error.response ? error.response.statusText : null,
    };
    const messages =flattenJSON(responseError.data)

    const requestBody = error.config ? error.config.data : null;

    console.error(`${errorMessage}: ${error}. Response data: ${JSON.stringify(responseError.data.error)} -- ${messages} . Request body: ${JSON.stringify(requestBody)}`);
    throw new Error(`${errorMessage}: Response data: ${messages}`);
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

function flattenJSON(obj, separatorKey = '--', separatorValue = ':') {
  const result = [];

  function traverse(obj, parentKey = '') {
      for (const key in obj) {
          const currentKey = parentKey ? `${parentKey}${separatorKey}${key}` : key;
          if (typeof obj[key] === 'object') {
              traverse(obj[key], currentKey);
          } else {
              result.push(`${currentKey}${separatorValue}${obj[key]}`);
          }
      }
  }

  traverse(obj);
  return result;
}

async function addUser(userData) {
  const url = '/users';
  response = await makeRequest(url, 'Error fetching current user', { method: 'post', body: userData });
  console.log(response[0].id)
  return response[0].id
}
async function updateUser(userID,userData) {
  const url = `/users/${userID}`;
  return makeRequest(url, 'Error fetching current user', { method: 'put', body: userData });
}


async function addOrganization(organizationData) {
  console.log(organizationData)
  const jsonObject = {"organization": organizationData};
  const url = '/organizations.json';
  response = await makeRequest(url, 'Error adding organization', { method: 'post', body: jsonObject });
  console.log(response.id);
  return response.id;
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
   user = await makeRequest(url, 'Error fetching user');
   const userEnd = {id: user[0]?.id} || {};
   return userEnd
}
async function getUsersByOrg(orgID) {

  const url = `/organizations/${orgID}/users`;
  return makeRequest(url, 'Error fetching user');
}

async function getAllorganizations() {
  const url = '/organizations.json';
  const response = await makeRequest(url, 'Error adding organization', { method: 'post', body: jsonObject });
  return response.id;
}

async function updateOrganization(organizationID, organizationData) {
  const url = `/organizations/${organizationID}.json`;
  return makeRequest(url, 'Error updating organization', { method: 'put', body: organizationData });
}

async function getAllOrganizations() {
  const url = '/organizations.json';
  return makeRequest(url, 'Error fetching all organizations');
}

async function getOrganizationsById(organizationID) {
  const url = `/organizations/${organizationID}.json`;
  return makeRequest(url, 'Error fetching organization by ID');
}

// Ticket-related functions
async function createTicket(ticketData) {
  const url = `/tickets.json`;
  return makeRequest(url, 'Error creating ticket', { method: 'post', body: ticketData });
}

async function addMessageToTicket(ticketId, ticket) {
  const url = `/tickets/${ticketId}/comments.json`;
  return makeRequest(url, 'Error adding message to ticket', { method: 'post', body: ticket });
}

async function getTicketsByStatus(ticketStatus) {
  const url = `/search.json?query=custom_status_id:${ticketStatus}`;
  return makeRequest(url, 'Error fetching tickets by status');
}

async function getTicketsNew() {
  const today = new Date(new Date().getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
  const url = `/search.json?query=created<=${today}&status:open+status:new&sort_by=created_at&sort_order=desc`;
  return makeRequest(url, 'Error fetching All Ticket with status new');
}

async function getTicketsold() {
  //here search has only with attachements
  const d = new Date(); d.setMonth(d.getMonth() - 17); d.setDate(d.getDate() - 15); const oneYearAgo = d.toISOString().slice(0, 10);
  const url = `/search.json?query=solved<=${oneYearAgo}&status:solved:new&has_attachment:true&sort_by=update_at&sort_order=desc`;
  return makeRequest(url, 'Error fetching All Ticket with status solved');
}

async function createTicket(ticketData) {
  const url = `/tickets.json`;
  const errorMessage = 'Error creating new ticket';
  const method = 'post';

  return makeRequest(url, errorMessage, {
    method,
    body: ticketData,
  });
}
async function addMessageToTicket(ticketId, ticket) {
  const url = `/tickets/${ticketId}/comments.json`;
  const errorMessage = 'Error adding message to ticket';
  const method = 'post';

  return makeRequest(url, errorMessage, { method,body: ticket});
}

async function getTicketsNotClosed() {
  const url = `/search.json?query=status:open+status:new+status:pending+status:resolved&sort_by=created_at&sort_order=desc`;
  return makeRequest(url, 'Error fetching All Ticket with status not closed');
}

async function getTicketsNewAssigned() {
  const url = '/search.json?query=assignee%3A*+status%3Aopen&sort_by=created_at&sort_order=desc';
  return makeRequest(url, 'Error fetching All Ticket with status new');
}

async function getTicketsByUser(userID) {
  const url = `/users/${userID}/tickets/requested`;
  return makeRequest(url, 'Error fetching All Ticket with status new');
}
async function getTicketsById(ticketID) {
  const url = `/tickets/${ticketID}.json`;
  return makeRequest(url, 'Error fetching All Ticket with status new');
}
async function getTicketsComments(ticketID) {
  const url = `/tickets/${ticketID}/comments`;
  return makeRequest(url, 'Error fetching All Ticket with status new');
}
async function redactCommentAttachment(ticketId,commentId, attachmentId) {
  const url =  `/tickets/${ticketId}/comments/${commentId}/attachments/${attachmentId}/redact.json `;
  return makeRequest(url, 'Error fetching All Ticket with status new',{ method: 'put' });
}

async function updateTicket(ticketId, ticketData) {
  const url = `/tickets/${ticketId}`;
  return await makeRequest(url, 'Error updating ticket', { method: 'put', body: ticketData });
}

async function getNonResolvedTicketCount() {
  const url = '/search.json?query=status<solved%20status<closed';
  const response = await makeRequest(url, 'Error fetching non-resolved ticket count');
  const count = response.length || 0;
  return count
}

async function getNonResolvedTicketCountOrganisation(organizationExternalId) {
  try {
    const organizationId = await getOrganizationIdByExternalId(organizationExternalId);
    const url = `/search.json?query=status<solved%20status<closed%20organization:${organizationId}`;
    const response = await makeRequest(url, 'Error fetching non-resolved ticket count');
    return { count: response.length || 0 };
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
async function getSuspendedTickets() {
  const url = '/suspended_tickets';
  return makeRequest(url, 'Error fetching suspended tickets');
}

async function recoverTicket(ticketId) {
  const url = `/suspended_tickets/${ticketId}`;
  const ticketData = {
    ticket: {
      status: 'open'
    }
  };
  return await makeRequest(url, 'Error recovering ticket', { method: 'get' });
}

async function recoverAllSuspendedTickets() {
  try {
    const suspendedTickets = await getSuspendedTickets();
    for (const ticket of suspendedTickets) {
      //console.log(ticket)
      console.log(`Recovering ticket with ID: ${ticket.id}`);
      await recoverTicket(ticket.id);
    }
    console.log('All suspended tickets have been recovered.');
  } catch (error) {
    console.error(`Error recovering suspended tickets: ${error.message}`);
    throw new Error(`Error recovering suspended tickets: ${error.message}`);
  }
}

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
  createTicket,
  addMessageToTicket,
  getTicketsNew,
  getTicketsold,
  getTicketsByStatus,
  getTicketsNotClosed,
  getTicketsNewAssigned,
  getTicketsByUser,
  getTicketsById,
  getTicketsComments,
  redactCommentAttachment,
  getNonResolvedTicketCount,
  recoverAllSuspendedTickets,
  getNonResolvedTicketCountOrganisation
};