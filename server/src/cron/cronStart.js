// cronJobs/cronStart.js
const cron = require('node-cron');
const MongoDB = require('../utils/mongodb');
const ScriptService = require('../services/ScriptService');
const scripts = require('../models/script');

const scriptsList = [
  { name: 'synchroCopro', script: require('../cron/synchroCopro') },
  { name: 'synchroUsers', script: require('../cron/synchroUsers') },
  //{ name: 'zendeskTicket', script: require('../cron/zendeskTicket') },
  //{ name: 'zendeskTicketAI', script: require('../cron/zendeskTicketAI') },
  //{ name: 'syncZendeskTags', script: require('../cron/syncZendeskTags') },
  { name: 'synchroTravaux', script: require('../cron/synchroTravaux') },
  //{ name: 'zendeskService', script: require('../services/zendeskService') },
  { name: 'synchroContratAssurance', script: require('../cron/synchroContratAssurance') },
  { name: 'synchroMandats', script: require('../cron/synchroMandats') },
  //{ name: 'SynchroMondayUserAffected', script: require('../cron/synchroMondayUserAffected') },
  { name: 'synchroContratEntretien', script: require('../cron/synchroContratEntretien') },
  { name: 'campagneChauffage', script: require('../cron/campagneChauffage') },
  { name: 'synchoBudgetCoproprietaire', script: require('../cron/synchoBudgetCoproprietaire') },
  { name: 'synchroComptaList401', script: require('../cron/synchroComptaList401') },
  { name: 'synchroComptaRapprochementBancaire', script: require('../cron/synchroComptaRapprochementBancaire') },
  { name: 'synchroFacture', script: require('../cron/synchroFacture') },
  { name: 'extractContratsEntretien', script: require('../cron/extractContratsEntretien') }
];


async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    return await callback();
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}



async function executeScript(name, script) {
  const startTime = new Date(); // Moved startTime to ensure it is always initialized
  try {
    const scriptState = await ScriptService.getScriptState(name);
    console.log(name, " --- " ,scriptState.status)
    if (scriptState && scriptState.status === 1) {
      console.log(`Starting script: ${name}`);

      await ScriptService.updateScriptStatus(name, 2); // Status 2 for "Running"
      await script.start(); // Assume script has a 'start' function

      const endTime = new Date();
      await ScriptService.updateScriptStatus(name, 0); // Status 0 for "Completed"
      await ScriptService.logExecutionHistory(name, startTime, endTime, 0, "Script executed successfully");
    }
  } catch (error) {
    console.error(`Error executing ${name} script: ${error}`);
    const endTime = new Date(); // Initialize endTime in case of error
    await ScriptService.logExecutionHistory(name, startTime, endTime, -1, `Script executed with Error: ${error.message}`);
    await ScriptService.updateScriptStatus(name, -1); // Status -1 for "Failed"
  }
}

function scheduleCronJobs() {
  cron.schedule('0 4 * * *', async () => {
    await executeScript('zendeskTicket', require('../cron/zendeskTicket'));
    await require('../services/zendeskService').recoverAllSuspendedTickets();
  });

  cron.schedule('0 5 * * *', async () => {
    await executeScript('synchroComptaList401', require('../cron/synchroComptaList401'));
    await executeScript('synchroComptaList472', require('../cron/synchroComptaList472'));
    await executeScript('synchroComptaRapprochementBancaire', require('../cron/synchroComptaRapprochementBancaire'));
    await executeScript('synchoBudgetCoproprietaire', require('../cron/synchoBudgetCoproprietaire'));
  });

  cron.schedule('0 0 * * 0', async () => {
    await executeScript('synchroCopro', require('../cron/synchroCopro'));
    await executeScript('synchroUsers', require('../cron/synchroUsers'));
    await executeScript('contratAssurance', require('./synchroContratAssurance'));
    await executeScript('synchroTravaux', require('../cron/synchroTravaux'));
  });

  cron.schedule('0 0 * * *', async () => {
    await executeScript('zendeskTicketAI', require('../cron/zendeskTicketAI'));
    await executeScript('synchroTravaux', require('../cron/synchroTravaux'));
    await executeScript('synchroContratEntretien', require('../cron/synchroContratEntretien'));
    await executeScript('SynchroMondayUserAffected', require('../cron/SynchroMondayUserAffected'));
    await executeScript('synchroMandats', require('../cron/synchroMandats'));
  });

  cron.schedule('*/5 * * * *', async () => {
    console.log('Starting cron 5 minutes')
    for (const { name, script } of scriptsList) {
      console.log(`Executing via batch script: ${name}`);
      await executeScript(name, script);
    }
  });
}

module.exports = scheduleCronJobs;