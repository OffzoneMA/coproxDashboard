// zendeskController.js
const createZendeskService = require('../services/zendeskService');

const subdomain = 'coprox8710'; // Replace with your Zendesk subdomain
const apiToken = 'F76kBykpqb6QjhQYZ5Dcy4eqC5KMme0qNsGFu2KW'; // Replace with your Zendesk API token

const zendeskService = createZendeskService(subdomain, apiToken);

async function getCurrentUser(req, res) {
  try {
    const user = await zendeskService.getCurrentUser();
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error fetching current user: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getNonResolvedTicketCount(req, res) {
  try {
    const count = await zendeskService.getNonResolvedTicketCount();
    res.status(200).json({ count });
  } catch (error) {
    console.error(`Error fetching non-resolved ticket count: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getCurrentUser,
  getNonResolvedTicketCount,
};
