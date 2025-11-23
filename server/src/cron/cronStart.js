/**
 * CRON SYSTEM ARCHITECTURE
 * ========================
 * 
 * This file manages TWO DISTINCT execution systems:
 * 
 * 1. SCHEDULED CRON EXECUTION (Automated)
 *    - Scripts run automatically on their configured schedule
 *    - Examples: Daily at 3am, Weekly on Sunday, Every 5 minutes
 *    - Uses: executeScheduledScript()
 *    - Does NOT check status flags
 *    - ⚠️  100% DATABASE-DRIVEN: All schedules come from MongoDB CronConfig collection
 *    - NO hardcoded fallbacks - database is single source of truth
 * 
 * 2. MANUAL SCRIPT EXECUTION (User-triggered)
 *    - User clicks "Run" button in UI
 *    - Sets script status to 1 (waiting to start)
 *    - Requires a cron configuration to check for status=1 scripts
 *    - Uses: executeManualScript()
 *    - Updates status: 1→2→0/-1 (waiting→running→success/error)
 * 
 * KEY DIFFERENCE:
 * - Scheduled: Runs on time, ignores status
 * - Manual: Runs when status=1, updates status through lifecycle
 * 
 * INITIALIZATION:
 * - First time setup: POST /cron-config/seed to populate database
 * - After changes: POST /cron-config/reload to restart cron jobs
 */

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

/**
 * Execute script as part of scheduled cron job (automated execution)
 * This runs scripts on their schedule regardless of status flags
 */
async function executeScheduledScript(name, script) {
  const startTime = new Date();
  console.log(`[CRON] Executing scheduled script: ${name}`);
  
  try {
    logs.logExecution(name);
    await script.start();
    
    const endTime = new Date();
    await ScriptService.logExecutionHistory(name, startTime, endTime, 0, "Scheduled cron execution completed successfully");
    console.log(`[CRON] ✓ Script ${name} completed successfully`);
  } catch (error) {
    console.error(`[CRON] ✗ Error executing scheduled script ${name}:`, error);
    const endTime = new Date();
    await ScriptService.logExecutionHistory(name, startTime, endTime, -1, `Scheduled cron execution error: ${error.message}`);
  }
}

/**
 * Execute script manually (triggered by user button click)
 * This checks the status flag to see if user requested execution
 */
async function executeManualScript(name, script) {
  const startTime = new Date();
  
  try {
    const scriptState = await ScriptService.getScriptState(name);
    
    // Only execute if status is 1 (user clicked the "run" button)
    if (scriptState && scriptState.status === 1) {
      console.log(`[MANUAL] Starting user-triggered script: ${name}`);
      logs.logExecution(name);

      await ScriptService.updateScriptStatus(name, 2); // Status 2 = "Running"
      await script.start();

      const endTime = new Date();
      await ScriptService.updateScriptStatus(name, 0); // Status 0 = "Success"
      await ScriptService.logExecutionHistory(name, startTime, endTime, 0, "Manual execution completed successfully");
      console.log(`[MANUAL] ✓ Script ${name} completed successfully`);
    }
  } catch (error) {
    console.error(`[MANUAL] ✗ Error executing manual script ${name}:`, error);
    const endTime = new Date();
    await ScriptService.logExecutionHistory(name, startTime, endTime, -1, `Manual execution error: ${error.message}`);
    await ScriptService.updateScriptStatus(name, -1); // Status -1 = "Failed"
  }
}

/**
 * Load cron configurations from MongoDB
 * NO HARDCODED FALLBACKS - Database is the single source of truth
 */
async function loadCronConfigs() {
  try {
    cronConfigs = await CronConfigService.getEnabledConfigs();
    console.log(`✓ Loaded ${cronConfigs.length} enabled cron configurations from database`);
    
    if (cronConfigs.length === 0) {
      console.warn('⚠️  No enabled cron configurations found in database!');
      console.warn('⚠️  Run POST /cron-config/seed to initialize default configurations');
    }
    
    return cronConfigs;
  } catch (error) {
    console.error('✗ Failed to load cron configurations from database:', error.message);
    console.error('✗ Cron system will not start. Please check database connection and run seed endpoint.');
    throw error; // Don't start cron system without database
  }
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

    // Special handling for the 5-minute cron - this checks for MANUAL triggers
    if (cronConfig.name === 'every-5-minutes') {
      console.log('[MANUAL TRIGGER CHECK] Scanning for user-triggered scripts (status=1)');
      for (const { name, script } of scriptsList) {
        try {
          await executeManualScript(name, script); // Only runs if status === 1
          successCount++;
        } catch (error) {
          console.error(`[MANUAL] Error checking script ${name}:`, error);
          errorCount++;
        }
      }
    } else {
      // Execute configured scripts on their SCHEDULED cron time
      const enabledScripts = cronConfig.scripts ? cronConfig.scripts.filter(s => s.enabled !== false) : [];
      
      for (const scriptConfig of enabledScripts) {
        try {
          console.log(`[SCHEDULED] Executing script: ${scriptConfig.name}`);
          const scriptModule = require(scriptConfig.modulePath);
          await executeScheduledScript(scriptConfig.name, scriptModule);
          successCount++;
        } catch (error) {
          console.error(`[SCHEDULED] Error executing script ${scriptConfig.name}:`, error);
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
 * DATABASE-ONLY: All cron configurations must exist in MongoDB
 */
async function scheduleCronJobs() {
  try {
    console.log('========================================');
    console.log('Initializing DATABASE-DRIVEN cron system');
    console.log('========================================');
    
    // Initialize scripts for backward compatibility
    await initializeScripts();
    
    // Load cron configurations from database (NO hardcoded fallbacks)
    const configs = await loadCronConfigs();
    
    if (configs.length === 0) {
      console.warn('⚠️  ========================================');
      console.warn('⚠️  NO CRON JOBS CONFIGURED IN DATABASE!');
      console.warn('⚠️  ========================================');
      console.warn('⚠️  To initialize: POST /cron-config/seed');
      console.warn('⚠️  Cron system running but no jobs scheduled');
      return; // Exit without starting jobs
    }
    
    // Start cron jobs from database
    await startCronJobs(configs);
    
    console.log('========================================');
    console.log(`✓ Cron system initialized with ${configs.length} jobs`);
    console.log('========================================');
    
    // Set up periodic reload (every hour) to pick up configuration changes
    const reloadJob = cron.schedule('0 * * * *', async () => {
      try {
        console.log('[AUTO-RELOAD] Reloading cron configurations from database...');
        await reloadCronJobs();
      } catch (error) {
        console.error('[AUTO-RELOAD] Failed to reload cron jobs:', error);
      }
    }, { timezone: TIMEZONE });
    
    activeJobs.set('__reload__', reloadJob);
    
  } catch (error) {
    console.error('✗ Failed to initialize cron job system:', error);
    console.error('✗ Check database connection and run: POST /cron-config/seed');
    throw error;
  }
}

// Export additional functions for external management
scheduleCronJobs.reload = reloadCronJobs;
scheduleCronJobs.stop = stopAllJobs;
scheduleCronJobs.getActiveJobs = () => Array.from(activeJobs.keys());
scheduleCronJobs.getConfigs = () => cronConfigs;

module.exports = scheduleCronJobs;