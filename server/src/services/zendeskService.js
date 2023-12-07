// zendeskService.js
const axios = require('axios');

function createZendeskService(subdomain, username, password) {
  const baseURL = `https://${subdomain}.zendesk.com/api/v2`;

  const axiosInstance = axios.create({
    baseURL,
    auth: {
      username,
      password,
    },
  });

  async function makeRequest(url, errorMessage) {
    try {
      console.log(`Making request to: ${url}`);
      const response = await axiosInstance.get(url);
      console.log(`Response received:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`${errorMessage}: ${error.message}`);
      throw new Error(`${errorMessage}: ${error.message}`);
    }
  }

  async function getCurrentUser() {
    const url = '/users/me.json';
    return makeRequest(url, 'Error fetching current user');
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
      
      // Assuming Zendesk API returns a count property in the response
      const count = response.count || 0;
      return { count };
    } catch (error) {
      throw new Error(`Error getting non-resolved ticket count for organization: ${error.message}`);
    }
  }

  async function getOrganizationIdByExternalId(organizationExternalId) {
    try {
      const url = `/organizations/search?external_id=${organizationExternalId}`;
      const response = await makeRequest(url, 'Error searching for organization by external ID');

      // Assuming Zendesk API returns an array of organizations in the response
      // and we are taking the first organization found
      const organization = response.organizations && response.organizations[0];

      if (!organization) {
        throw new Error(`Organization not found with external ID: ${organizationExternalId}`);
      }

      return organization.id;
    } catch (error) {
      throw new Error(`Error getting organization ID by external ID: ${error.message}`);
    }
  }

  return {
    getCurrentUser,
    getNonResolvedTicketCount,
    getNonResolvedTicketCountOrganisation
  };
}

module.exports = createZendeskService;
