// zendeskController.js
const zendeskService = require('../services/zendeskService');


async function handleRequest(res, action, errorMessage) {
  try {
    const result = await action();
    res.status(200).json(result);
  } catch (error) {
    console.error(`${errorMessage}: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getCurrentUser(req, res) {
  await handleRequest(res, zendeskService.getCurrentUser, 'Error fetching current user');
}
async function getAllUsers(req, res) {
  await handleRequest(res, zendeskService.getAllUsers, 'Error fetching current user');
}
async function getUserFromID(req, res) {
  const userID = req.params.ID;
  await handleRequest(
    res,
    () => zendeskService.getUserFromID(userID),
    'Error fetching non-resolved ticket count for organization'
  );
}
async function getAllorganizations(req, res) {
  await handleRequest(res, zendeskService.getAllorganizations, 'Error fetching current organisation');
}
async function getTicketsNew(req, res) {
  const today = new Date(new Date().getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
  const url = `/search.json?query=created>=${today}&status:open+status:new&sort_by=created_at&sort_order=desc`;
  await handleRequest(res, zendeskService.getTicketsNew, 'Error fetching current tickets with status');
}
async function getTicketsNotClosed(req, res) {
  await handleRequest(res, zendeskService.getTicketsNotClosed, 'Error fetching current tickets with status');
}
async function updateTicket(req, res) {
  const ticketId = req.params.ticket_id; 
  const ticketData = req.params.tagToAdd; 
  await handleRequest(res,zendeskService.updateTicket(ticketId, ticketData), `Error updating the ticket: ${ticketId}`);
}

async function getNonResolvedTicketCount(req, res) {
  await handleRequest(res, zendeskService.getNonResolvedTicketCount, 'Error fetching non-resolved ticket count');
}
async function getNonResolvedTicketCountOrganisation(req, res) {
  const organizationExternalId = req.params.ID;
  await handleRequest(
    res,
    () => zendeskService.getNonResolvedTicketCountOrganisation(organizationExternalId),
    'Error fetching non-resolved ticket count for organization'
  );
}

module.exports = {
  getCurrentUser,
  getAllUsers,
  getUserFromID,
  getAllorganizations,
  getTicketsNew,
  getTicketsNotClosed,
  updateTicket,
  getNonResolvedTicketCount,
  getNonResolvedTicketCountOrganisation
};
