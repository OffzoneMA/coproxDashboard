const vilogiService = require('../services/vilogiService');

const synchroUsers = {
  start: () => {
    console.log('Synchronizing users...');
    
    // Call a service method to fetch users
    //const users = vilogiService.fetchUsers();
    
    // Add your synchronization logic here, using the fetched users data
    //console.log('Fetched users:', users);
  },
};

module.exports = synchroUsers;
