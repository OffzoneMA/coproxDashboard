// zendeskService.js
const axios = require('axios');

function createZendeskService(subdomain, apiToken) {
  const baseUrl = `https://${subdomain}.zendesk.com/api/v2`;

  async function getCurrentUser() {
    try {
      const url = `${baseUrl}/users/me.json`;

      console.log(`Making request to: ${url}`);

      const response = await axios.get(url, {
        auth: {
          username: `${apiToken}/token`,
          password: 'x', // The password is arbitrary and required by Zendesk API
        },
      });

      console.log(`Response received:`, response.data);

      return response.data.user;
    } catch (error) {
      console.error(`Error fetching current user: ${error.message}`);
      throw new Error(`Error fetching current user: ${error.message}`);
    }
  }

  async function getNonResolvedTicketCount() {
    try {
      const url = `${baseUrl}/tickets/count.json?status=unresolved`;

      console.log(`Making request to: ${url}`);

      const response = await axios.get(url, {
        auth: {
          username: `${apiToken}/token`,
          password: 'x', // The password is arbitrary and required by Zendesk API
        },
      });

      console.log(`Response received:`, response.data);

      return response.data.count;
    } catch (error) {
      console.error(`Error fetching non-resolved ticket count: ${error.message}`);
      throw new Error(`Error fetching non-resolved ticket count: ${error.message}`);
    }
  }

  return {
    getCurrentUser,
    getNonResolvedTicketCount,
  };
}

module.exports = createZendeskService;
