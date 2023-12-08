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

  async function makeRequest(url, errorMessage, { method = 'get', params = {}, body = {} } = {}) {
    try {
      const link = `${baseURL}${url}`;
      console.log(`Making ${method.toUpperCase()} request to: ${link}`);

      const response = await axios({
        method: method.toLowerCase(),
        url: link,
        params,
        data: method.toLowerCase() !== 'get' ? body : undefined,
        auth: { username, password },
      });

      //console.log(`Response received:`, response.data);
      return response.data;
    } catch (error) {
        console.error(`${errorMessage}: ${error.message}`);
      throw new Error(`${errorMessage}: ${error.message}`);
    }z
  }


  async function getCurrentUser() {
    const url = '/users/me.json';
    return makeRequest(url, 'Error fetching current user');
  }

  
  async function getAllUsers() {
    let allUsers = [];
    let nextPage = '/users.json';
  
    do {
      const response = await makeRequest(nextPage, 'Error fetching end users', { method: 'get', params: { role: 'end-user' } });
      const users = response.users || [];
  
      allUsers = allUsers.concat(users);
  
      nextPage = extractNextPage(response.next_page);
    } while (nextPage);
  
    return allUsers;
  }
  
  function extractNextPage(nextPage) {
    if (!nextPage) {
      return null;
    }
  
    const nextPageRegex = /\/users\.json\?page=(\d+)&role=end-user/;
    const match = nextPage.match(nextPageRegex);
  
    return match ? `/users.json?page=${parseInt(match[1], 10)}&role=end-user` : null;
  }
  
  

  async function getUserFromID(userID) {
    const url = `/users/${userID}.json`;
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
  
  async function updateTicket(ticketId, tagToAdd) {
    const url = `/tickets/${ticketId}`;
    const body = {
      ticket: {
        tags: [tagToAdd]
      },
    };

    // Pass method as lowercase 'put' here
    return await makeRequest(url, 'Error updating ticket', { method: 'put', body });
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
      console.error(`Error getting non-resolved ticket count for organization: ${error.message}`);
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
        // Instead of throwing an error
        return null; // or return { error: 'Organization not found' };
      }

      return organization.id;
    } catch (error) {
      console.error(`Error getting organization ID by external ID: ${error.message}`);
      throw new Error(`Error getting organization ID by external ID: ${error.message}`);
    }
  }

  return {
    updateTicket,
    getCurrentUser,
    getAllUsers,
    getUserFromID,
    getAllorganizations,
    getTicketsNew,
    updateTicket,
    getNonResolvedTicketCount,
    getNonResolvedTicketCountOrganisation
  };
}

module.exports = createZendeskService;
