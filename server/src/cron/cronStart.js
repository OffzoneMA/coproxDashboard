// cronJobs/cronStart.js
const cron = require('node-cron');
const synchroCopro = require('./synchroCopro');
const synchroUsers = require('./synchroUsers');
const zendeskTicket = require('./zendeskTicket');
const zendeskTicketAI = require('./zendeskTicketAI');
const syncZendeskTags = require('./syncZendeskTags');
const synchroTravaux = require('./synchroTravaux');
const zendeskService = require('../services/zendeskService');
const contratAssurance = require('./contratAssurance');
const synchroMandats = require('./synchroMandats');


function cronStart() {
  cron.schedule('0 * * * *', async () => {
    await zendeskTicket.start();
    await zendeskService.recoverAllSuspendedTickets();
  });


  

  cron.schedule('0 0 * * 0', async () => {
    await synchroCopro.start();
    await synchroUsers.start();
    await contratAssurance.start();
    await synchroTravaux.start();
    await synchroMandats.start();
  });


  cron.schedule('0 0 * * *', async () => {
    console.log("-------------------------Starting Zendesk Ticket AI--------------------------------------------")
    await zendeskTicketAI.start();
    await synchroTravaux.start();
    console.log("-------------------------Ending Zendesk Ticket AI--------------------------------------------")
  });

  cron.schedule('0 11 * * *', async () => {
    await syncZendeskTags.start();
    await zendeskTicket.start();
  });

  cron.schedule('0 15 * * *', async () => {
    await syncZendeskTags.start();
  });
}

module.exports = cronStart;