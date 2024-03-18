// Import required services and controllers
const vilogiService = require('../services/vilogiService');
const coproService = require('../services/coproService');
const PersonService = require('../services/personService');
const ZendeskService = require('../services/zendeskService');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../logs/cron.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' means append

function FileLog(...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${args.join(' ')}\n`;
  logStream.write(logMessage);
  process.stdout.write(logMessage); // Optional: Write to the console as well
}

const logFilePath2 = path.join(__dirname, '../../logs/stats.txt');
const logStream2 = fs.createWriteStream(logFilePath2, { flags: 'a' }); // 'a' means append
function FileStatLog(...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${args.join(' ')}\n`;
  logStream2.write(logMessage);
  process.stdout.write(logMessage); // Optional: Write to the console as well
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Object for synchronizing users
const synchroUsers = {
  start: async () => {
      Tickets= await ZendeskService.recoverAllSuspendedTickets();
  },
};

// Export the synchronization object
module.exports = synchroUsers;
