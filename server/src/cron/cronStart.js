// cronJobs/cronStart.js
const cron = require('node-cron');
const synchroCopro = require('./synchroCopro');
const synchroUsers = require('./synchroUsers');
const zendeskTicket = require('./zendeskTicket');
const zendeskTicketAI = require('./zendeskTicketAI');
const syncZendeskTags = require('./syncZendeskTags');
const RecoverZendeskTicket = require('./RecoverZendeskTicket');


function cronStart() {
  cron.schedule('0 * * * *', () => {
    zendeskTicket.start();
    RecoverZendeskTicket.start();
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
    zendeskTicket.start();
  });

  cron.schedule('0 15 * * *', () => {
    syncZendeskTags.start();
  });
}

module.exports = cronStart;