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
      let allData = [];
      let nextPage = url;
  
      do {
        const link = `${baseURL}${nextPage}`;
        console.log(link);
        console.log(`Making ${method.toUpperCase()} request to: ${link}`);
  
        const response = await axios({
          method: method.toLowerCase(),
          url: link,
          params,
          data: method.toLowerCase() !== 'get' ? body : undefined,
          auth: { username, password },
        });
  
        const responseData = response.data;
        // Merge data if 'next_page' exists
        if (responseData.next_page) {
          //console.log("here is a next page", responseData.next_page)
          allData = allData.concat(responseData.users || responseData.organizations || responseData.results || responseData.tickets); // Assume single entity if 'users' property doesn't exist
          nextPage = extractNextPage(responseData.next_page);
          
          
        } else {
          //console.log("no Next page")
          nextPage = null;
          allData = allData.concat(responseData.users || responseData.user || responseData.organizations || responseData.organization || responseData.results || responseData.tickets|| responseData.ticket || responseData.count   );
        }
        
      } while (nextPage);
      
      //console.log("all data :", allData)
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
    const path = url.pathname + url.search;
    return path.startsWith("/") ? path : `/${path}`;
  }
  function extractNextPage(nextPage) {
    if (!nextPage) {
      return null;
    }
  
    const url = new URL(nextPage);
    const pathParts = url.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const result = `/${lastPart}${url.search}`;
    
    console.log("pathParts :",pathParts," lastPart : ",lastPart, " result :", result )
  
    return result;
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


    // Pass method as lowercase 'put' here
    return await makeRequest(url, 'Error updating ticket', { method: 'put', changes });
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

      // Assuming Zendesk API returns an array of organizations in the response
      // and we are taking the first organization found
      const organization = response[0]

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
