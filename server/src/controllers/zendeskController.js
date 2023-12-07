// zendeskController.js
const createZendeskService = require('../services/zendeskService');

const subdomain = 'coprox8710'; // Replace with your Zendesk subdomain
const username = 'software@youssefdiouri.net/token'; // Replace with your Zendesk username
const password = 'EqkSrwivQe8RxioxUT4VFdiP1BR0ITMn0EgmQ8Sc'; // Replace with your Zendesk password

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
  getNonResolvedTicketCount,
  getNonResolvedTicketCountOrganisation
};
