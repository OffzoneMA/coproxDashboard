// cronJobs/cronStart.js
const cron = require('node-cron');
const synchroCopro = require('./synchroCopro');
const synchroUsers = require('./synchoUsers');
const zendeskTicket = require('./zendeskTicket');
const zendeskTicketAI = require('./zendeskTicketAI');
const syncZendeskTags = require('./syncZendeskTags');

function cronStart() {
  cron.schedule('0 12 * * *', () => {
    zendeskTicket.start();
  });

  cron.schedule('0 0 * * 0', () => {
    synchroCopro.start();
    synchroUsers.start();
  });

  cron.schedule('0 * * * *', () => {
    zendeskService.recoverAllSuspendedTickets();
  });

  cron.schedule('0 0 * * *', () => {
    console.log("-------------------------Starting Zendesk Ticket AI--------------------------------------------")
    zendeskTicketAI.start();
    console.log("-------------------------Ending Zendesk Ticket AI--------------------------------------------")
  });

  cron.schedule('0 11 * * *', () => {
    syncZendeskTags.start();
  });

  cron.schedule('0 15 * * *', () => {
    syncZendeskTags.start();
  });
}

module.exports = cronStart;