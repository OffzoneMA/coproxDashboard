const cron = require('node-cron');
const MongoDB = require('../utils/mongodb');
const ScriptService = require('../services/scriptService');
const CronConfigService = require('../services/cronConfigService');
const logs = require('../services/logs');
const vilogiService = require('../services/vilogiService');

// Ensure all cron jobs run on UTC time
const TIMEZONE = 'Etc/UTC';

let scriptsList = [];
let activeJobs = new Map(); // Track active cron jobs
let cronConfigs = []; // Store loaded configurations

async function initializeScripts() {
  const dbScripts = await ScriptService.getListScripts();
  scriptsList = dbScripts
    .map(scriptInfo => {
      try {
        return {
          name: scriptInfo.name,
          script: require(`../cron/${scriptInfo.name}`)
        };
      } catch (err) {
        console.log(`Could not load script: ${scriptInfo.name}`);
        return null;
      }
    })
    .filter(script => script !== null);
}

async function connectAndExecute(callback) {
  try {
    await MongoDB.connectToDatabase();
    return await callback();
  } catch (error) {
    console.error('Error connecting and executing:', error.message);
    throw error;
  }
}

async function startScriptCron(name, script) {
  console.log("startCrontab from script cont start ")
  await script.start();
}

async function executeScript(name, script) {
  const startTime = new Date(); // Moved startTime to ensure it is always initialized
  try {
    const scriptState = await ScriptService.getScriptState(name);
    if (scriptState && scriptState.status === 1) {
      console.log(`Starting script from Dashbaord: ${name}`);
      logs.logExecution(name)

      await ScriptService.updateScriptStatus(name, 2); // Status 0 for "Running"
      await script.start(); // Assume script has a 'start' function

      const endTime = new Date();
      await ScriptService.updateScriptStatus(name, 0); // Status 2 for "Completed"
      await ScriptService.logExecutionHistory(name, startTime, endTime, 0, "Script executed successfully");
    }
  } catch (error) {
    console.error(`Error executing ${name} script: ${error}`);
    const endTime = new Date(); // Initialize endTime in case of error
    await ScriptService.logExecutionHistory(name, startTime, endTime, -1, `Script executed with Error: ${error.message}`);
    await ScriptService.updateScriptStatus(name, -1); // Status -1 for "Failed"
  }
}

/**
 * Load cron configurations from MongoDB
 */
async function loadCronConfigs() {
  try {
    cronConfigs = await CronConfigService.getEnabledConfigs();
    console.log(`Loaded ${cronConfigs.length} enabled cron configurations from database`);
    return cronConfigs;
  } catch (error) {
    console.error('Failed to load cron configurations from database:', error.message);
    // Fall back to legacy hardcoded schedules if database is unavailable
    return await loadLegacySchedules();
  }
}

/**
 * Legacy fallback schedules (hardcoded as before)
 */
async function loadLegacySchedules() {
  console.log('Using legacy hardcoded cron schedules as fallback');
  return [
    {
      name: 'morning-sync-3am',
      schedule: '0 3 * * *',
      timezone: TIMEZONE,
      description: 'Morning synchronization tasks at 3 AM',
      scripts: [
        { name: 'synchroRapelles', modulePath: '../cron/synchroRapelles', enabled: true },
        { name: 'synchroFacture', modulePath: '../cron/synchroFacture', enabled: true },
        { name: 'zendeskTicket', modulePath: '../cron/zendeskTicket', enabled: true },
        { name: 'recoverAllSuspendedTickets', modulePath: '../services/zendeskService', enabled: true }
      ]
    },
    {
      name: 'early-morning-5am',
      schedule: '0 5 * * *',
      timezone: TIMEZONE,
      description: 'Early morning accounting sync at 5 AM',
      scripts: [
        { name: 'synchroComptaList401', modulePath: '../cron/synchroComptaList401', enabled: true },
        { name: 'synchroComptaList472', modulePath: '../cron/synchroComptaList472', enabled: true },
        { name: 'synchroComptaRapprochementBancaire', modulePath: '../cron/synchroComptaRapprochementBancaire', enabled: true }
      ]
    },
    {
      name: 'midnight-1am',
      schedule: '0 1 * * *',
      timezone: TIMEZONE,
      description: 'Midnight tasks at 1 AM',
      scripts: [
        { name: 'synchroMandats', modulePath: '../cron/synchroMandats', enabled: true },
        { name: 'synchroContratEntretien', modulePath: '../cron/synchroContratEntretien', enabled: true },
        { name: 'contratAssurance', modulePath: './synchroContratAssurance', enabled: true },
        { name: 'synchroSuiviVieCopro', modulePath: '../cron/synchroSuiviVieCopro', enabled: true }
      ]
    },
    {
      name: 'weekly-sunday',
      schedule: '0 0 * * 0',
      timezone: TIMEZONE,
      description: 'Weekly tasks on Sunday midnight',
      scripts: [
        { name: 'synchoBudgetCoproprietaire', modulePath: '../cron/synchoBudgetCoproprietaire', enabled: true },
        { name: 'synchroCopro', modulePath: '../cron/synchroCopro', enabled: true },
        { name: 'synchroUsers', modulePath: '../cron/synchroUsers', enabled: true }
      ]
    },
    {
      name: 'weekly-saturday',
      schedule: '0 0 * * 6',
      timezone: TIMEZONE,
      description: 'Weekly tasks on Saturday midnight',
      scripts: [
        { name: 'contratAssurance', modulePath: './synchroContratAssurance', enabled: true },
        { name: 'synchroTravaux', modulePath: '../cron/synchroTravaux', enabled: true }
      ]
    },
    {
      name: 'evening-7pm',
      schedule: '0 19 * * *',
      timezone: TIMEZONE,
      description: 'Evening OCR processing at 7 PM',
      scripts: [
        { name: 'synchroFactureOCRMonday', modulePath: '../cron/synchroFactureOCRMonday', enabled: true }
      ]
    },
    {
      name: 'every-5-minutes',
      schedule: '*/5 * * * *',
      timezone: TIMEZONE,
      description: 'Database-driven scripts every 5 minutes',
      scripts: [] // This will use the scriptsList from database
    }
  ];
}

/**
 * Execute scripts for a cron configuration
 */
async function executeCronScripts(cronConfig) {
  const startTime = new Date();
  let successCount = 0;
  let errorCount = 0;

  try {
    console.log(`Executing cron job: ${cronConfig.name} - ${cronConfig.description || 'No description'}`);
    
    // Log Vilogi counter for legacy compatibility
    let counter = await vilogiService.countConenction();
    logs.logVilogiCounter(counter[0].nombreAppel);
    logs.logExecution(`------------- Lancement ${cronConfig.name} - `, counter[0].nombreAppel);

    // Special handling for the 5-minute cron that uses scriptsList
    if (cronConfig.name === 'every-5-minutes') {
      console.log('Starting cron 5 minutes - database scripts');
      for (const { name, script } of scriptsList) {
        try {
          await executeScript(name, script);
          successCount++;
        } catch (error) {
          console.error(`Error in 5-minute script ${name}:`, error);
          errorCount++;
        }
      }
    } else {
      // Execute configured scripts
      const enabledScripts = cronConfig.scripts ? cronConfig.scripts.filter(s => s.enabled !== false) : [];
      
      for (const scriptConfig of enabledScripts) {
        try {
          console.log(`Executing script: ${scriptConfig.name}`);
          const scriptModule = require(scriptConfig.modulePath);
          await startScriptCron(scriptConfig.name, scriptModule);
          successCount++;
        } catch (error) {
          console.error(`Error executing script ${scriptConfig.name}:`, error);
          errorCount++;
        }
      }
    }

    const endTime = new Date();
    const runTime = endTime - startTime;
    
    // Update run statistics if this is a database-managed config
    if (cronConfig._id) {
      try {
        await CronConfigService.updateRunStats(cronConfig.name, runTime, errorCount === 0);
      } catch (error) {
        console.error('Failed to update cron run stats:', error);
      }
    }

    console.log(`Cron job ${cronConfig.name} completed - Success: ${successCount}, Errors: ${errorCount}, Runtime: ${runTime}ms`);

  } catch (error) {
    console.error(`Critical error in cron job ${cronConfig.name}:`, error);
    errorCount++;
    
    // Update error stats if this is a database-managed config
    if (cronConfig._id) {
      try {
        const endTime = new Date();
        const runTime = endTime - startTime;
        await CronConfigService.updateRunStats(cronConfig.name, runTime, false);
      } catch (statError) {
        console.error('Failed to update cron error stats:', statError);
      }
    }
  }
}

/**
 * Stop all active cron jobs
 */
function stopAllJobs() {
  console.log(`Stopping ${activeJobs.size} active cron jobs`);
  activeJobs.forEach((job, name) => {
    try {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    } catch (error) {
      console.error(`Error stopping cron job ${name}:`, error);
    }
  });
  activeJobs.clear();
}

/**
 * Start cron jobs based on configurations
 */
async function startCronJobs(configs) {
  for (const config of configs) {
    try {
      const timezone = config.timezone || TIMEZONE;
      
      console.log(`Scheduling cron job: ${config.name} with schedule: ${config.schedule}`);
      
      const job = cron.schedule(config.schedule, () => {
        executeCronScripts(config);
      }, { 
        timezone: timezone,
        scheduled: false // Don't start immediately
      });

      // Store job reference
      activeJobs.set(config.name, job);
      
      // Start the job
      job.start();
      
      console.log(`Started cron job: ${config.name}`);
      
    } catch (error) {
      console.error(`Failed to schedule cron job ${config.name}:`, error);
    }
  }
}

/**
 * Reload cron jobs from database
 */
async function reloadCronJobs() {
  console.log('Reloading cron jobs from database...');
  
  // Stop existing jobs
  stopAllJobs();
  
  // Load new configurations
  const configs = await loadCronConfigs();
  
  // Start new jobs
  await startCronJobs(configs);
  
  console.log(`Reloaded ${configs.length} cron jobs`);
}

/**
 * Main function to initialize and schedule cron jobs
 */
async function scheduleCronJobs() {
  try {
    console.log('Initializing cron job system...');
    
    // Initialize scripts for backward compatibility
    await initializeScripts();
    
    // Load cron configurations from database
    const configs = await loadCronConfigs();
    
    // Start cron jobs
    await startCronJobs(configs);
    
    console.log(`Cron job system initialized with ${configs.length} jobs`);
    
    // Set up periodic reload (every hour) to pick up configuration changes
    const reloadJob = cron.schedule('0 * * * *', async () => {
      try {
        await reloadCronJobs();
      } catch (error) {
        console.error('Failed to reload cron jobs:', error);
      }
    }, { timezone: TIMEZONE });
    
    activeJobs.set('__reload__', reloadJob);
    
  } catch (error) {
    console.error('Failed to initialize cron job system:', error);
    throw error;
  }
}

// Export additional functions for external management
scheduleCronJobs.reload = reloadCronJobs;
scheduleCronJobs.stop = stopAllJobs;
scheduleCronJobs.getActiveJobs = () => Array.from(activeJobs.keys());
scheduleCronJobs.getConfigs = () => cronConfigs;

module.exports = scheduleCronJobs;