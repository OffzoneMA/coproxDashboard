// cronJobs/cronStart.js
const MongoDB = require('../utils/mongodb');
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
const SynchroMondayUserAffected = require('./synchroMondayUserAffected');
const synchroContratEntretien = require('./synchroContratEntretien');

async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    const result = await callback();
    return result;
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  } 
}

const scripts = [
  { name: 'synchroCopro', script: require('../cron/synchroCopro') },
  { name: 'synchroUsers', script: require('../cron/synchroUsers') },
  { name: 'zendeskTicket', script: require('../cron/zendeskTicket') },
  { name: 'zendeskTicketAI', script: require('../cron/zendeskTicketAI') },
  { name: 'syncZendeskTags', script: require('../cron/syncZendeskTags') },
  { name: 'synchroTravaux', script: require('../cron/synchroTravaux') },
  { name: 'zendeskService', script: require('../services/zendeskService') },
  { name: 'contratAssurance', script: require('../cron/contratAssurance') },
  { name: 'synchroMandats', script: require('../cron/synchroMandats') },
  { name: 'SynchroMondayUserAffected', script: require('../cron/synchroMondayUserAffected') },
  { name: 'synchroContratEntretien', script: require('../cron/synchroContratEntretien') }
];



function cronStart() {
  cron.schedule('0 4 * * *', async () => {
    await zendeskTicket.start();
    await zendeskService.recoverAllSuspendedTickets();
  });


  cron.schedule('0 0 * * 0', async () => {
    await synchroCopro.start();
    await synchroUsers.start();
    await contratAssurance.start();
    await synchroTravaux.start();
  });


  cron.schedule('0 0 * * *', async () => {
    console.log("-------------------------Starting Zendesk Ticket AI--------------------------------------------")
    await zendeskTicketAI.start();
    await synchroTravaux.start();
    await synchroContratEntretien.start();
    await SynchroMondayUserAffected.start();
    await synchroMandats.start();
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


cron.schedule('*/5 * * * *', async () => {
  for (const { name, script } of scripts) {
      try {
          // Connect to MongoDB and execute asynchronously
          await connectAndExecute(async () => {
              const coproprieteCollection = MongoDB.getCollection('ScriptState');
               // Get the current script state
              const scriptState = await coproprieteCollection.findOne({ name });
              if (scriptState && scriptState.status === 1) {
                  // Execute the script
                  console.log(scriptState)
                  await script.start();
                  // Update script state to not started after execution
                  await coproprieteCollection.updateOne({ name }, { $set: { status: 0 } });
              }
          });
      } catch (error) {
          console.error(`Error executing ${name} script: ${error}`);
      }
  }
});


module.exports = cronStart;