// zendeskController.js
const createZendeskService = require('../services/zendeskService');
require('dotenv').config(); // Load environment variables from .env

const subdomain = process.env.ZENDESK_SUBDOMAIN;
const username = process.env.ZENDESK_USERNAME;
const password = process.env.ZENDESK_PASSWORD;


const zendeskService = createZendeskService(subdomain, username, password);

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
  await handleRequest(res, zendeskService.getTicketsNew, 'Error fetching current tickets with status');
}
async function updateTicket(req, res) {
  const ticketId = req.params.ticket_id; 
  const tagToAdd = req.params.tagToAdd; 
  console.log();  // Add any additional logging or processing you need here
  await handleRequest(res,zendeskService.updateTicket(ticketId, tagToAdd), `Error updating the ticket: ${ticketId}`);
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
  updateTicket,
  getNonResolvedTicketCount,
  getNonResolvedTicketCountOrganisation
};
