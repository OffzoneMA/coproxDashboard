// cronJobs/cronStart.js
const cron = require('node-cron');
const MongoDB = require('../utils/mongodb');
const ScriptService = require('../services/scriptService');
const scripts = require('../models/script');
const logs = require('../services/logs');
const vilogiService = require('../services/vilogiService');

//const { generateAccessToken } = require('../utils/dropbox');

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
  { name: 'synchroComptaList472', script: require('../cron/synchroComptaList472') },

  
  { name: 'synchroComptaRapprochementBancaire', script: require('../cron/synchroComptaRapprochementBancaire') },
  { name: 'synchroFactureOCR', script: require('../cron/synchroFactureOCR') },
  { name: 'synchroFacture', script: require('../cron/synchroFacture') },
  //{ name: 'extractContratsEntretien', script: require('../cron/extractContratsEntretien') }
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


async function startScriptCron(name,script) {
  console.log("startCrontab from script cont start ")
  await script.start();
}

async function executeScript(name, script) {
  //console.log("startExecuteScript")
  const startTime = new Date(); // Moved startTime to ensure it is always initialized
  try {
    const scriptState = await ScriptService.getScriptState(name);
    //console.log(name, " --- " ,scriptState.status)
    if (scriptState && scriptState.status === 1) {
      console.log(`Starting script from Dashbaord: ${name}`);
      logs.logExecution(name)

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
  
  cron.schedule('0 3 * * *', async () => {//equivalant a 4h
    let counter =await vilogiService.countConenction();
    logs.logVilogiCounter(counter[0].nombreAppel)
    logs.logExecution(" ------------- Lancement script 3h  - ", counter[0].nombreAppel)
    await startScriptCron('zendeskTicket', require('../cron/zendeskTicket'));
    await startScriptCron('recoverAllSuspendedTickets',require('../services/zendeskService'));
    await startScriptCron('synchroFactureOCR',require('../services/synchroFactureOCR'));
  });

  cron.schedule('0 5 * * *', async () => {//equivalant a 6h 
    let counter =await vilogiService.countConenction();
    logs.logVilogiCounter(counter[0].nombreAppel)
    logs.logExecution(" ------------- Lancement script 4h  - ", counter[0].nombreAppel)
    await startScriptCron('synchroComptaList401',require('../cron/synchroComptaList401'));
    await startScriptCron('synchroComptaList472', require('../cron/synchroComptaList472'));
    await startScriptCron('synchroComptaRapprochementBancaire', require('../cron/synchroComptaRapprochementBancaire'));
    await startScriptCron('synchroFacture', require('../cron/synchroFacture'));
    await startScriptCron('SynchroMondayUserAffected', require('../cron/SynchroMondayUserAffected'));
  });

  cron.schedule('0 1 * * *', async () => {// equivalant a 9h 
    console.log("------------- Lancement script 0h ")
    let counter =await vilogiService.countConenction();
    console.log(counter[0].nombreAppel)
    logs.logVilogiCounter(counter[0].nombreAppel)
    logs.logExecution(" ------------- Lancement script 0h  - ", counter[0].nombreAppel)
    //await startScriptCron('zendeskTicketAI', require('../cron/zendeskTicketAI'));
    await startScriptCron('synchroTravaux', require('../cron/synchroTravaux'));
    await startScriptCron('synchroMandats', require('../cron/synchroMandats'));
    await startScriptCron('synchroContratEntretien', require('../cron/synchroContratEntretien'));
  });

  cron.schedule('0 0 * * 0', async () => {
    let counter =await vilogiService.countConenction();
    logs.logVilogiCounter(counter[0].nombreAppel)
    await startScriptCron('synchoBudgetCoproprietaire', require('../cron/synchoBudgetCoproprietaire'));
    await startScriptCron('synchroCopro', require('../cron/synchroCopro'));
    await startScriptCron('synchroUsers', require('../cron/synchroUsers'));
    await startScriptCron('contratAssurance', require('./synchroContratAssurance'));
    await startScriptCron('synchroTravaux', require('../cron/synchroTravaux'));
  });



  cron.schedule('*/5 * * * *', async () => {
    console.log('Starting cron 5 minutes')
    //let counter = await vilogiService.countConenction();
    //logs.logVilogiCounter(counter[0].nombreAppel)
    for (const { name, script } of scriptsList) {
      //console.log(`Executing via batch script: ${name}`);
      await executeScript(name, script);
    }
  });
}

module.exports = scheduleCronJobs;