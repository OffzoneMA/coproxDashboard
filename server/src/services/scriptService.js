const mongoose = require('mongoose');
const MongoDB = require('../utils/mongodb');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('script');
const CronConfigRepository = require('../repositories/cronConfigRepository');
const fs = require('fs').promises;
const path = require('path');

/**
 * @typedef {Object} ScriptLog
 * @property {ObjectId} logId
 * @property {number} status
 * @property {Date} startTime
 * @property {Date} endTime
 * @property {string} message
 * @property {number} apicalls
 */

class ScriptService {
  static async addScript(scriptName, scriptContent) {
    if (!scriptName || !scriptContent) {
      throw new Error('Script name and content are required');
    }

    if (!scriptName.endsWith('.js')) {
      scriptName += '.js';
    }

    // Sanitize script name to prevent directory traversal
    const sanitizedScriptName = path.basename(scriptName);
    const scriptPath = path.join(__dirname, '../cron', sanitizedScriptName);

    // Check if file exists
    try {
      await fs.access(scriptPath);
      throw new Error(`Script "${sanitizedScriptName}" already exists`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Write file
    await fs.writeFile(scriptPath, scriptContent, 'utf8');

    // Add to database
    return this.connectAndExecute(async () => {
      const result = await this.getScriptCollection().updateOne(
        { name: sanitizedScriptName },
        { 
          $set: { 
            name: sanitizedScriptName,
            status: 0, // Initial status
            logs: [],
            execution_history: []
          } 
        },
        { upsert: true }
      );
      
      logger.info('Added new script', { meta: { scriptName: sanitizedScriptName } });
      return { name: sanitizedScriptName, path: scriptPath };
    });
  }

  static async connectAndExecute(callback) {
    try {
      logger.debug('MongoDB connect start');
      await MongoDB.connectToDatabase();
      const res = await callback();
      logger.info('MongoDB operation success');
      return res;
    } catch (error) {
      logError(error, 'Database operation failed');
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  static getScriptCollection() {
    return MongoDB.getCollection('ScriptState');
  }

  static async updateScriptStatus(scriptName, status, option) {
    if (!scriptName || status === undefined) {
      throw new Error('Script name and status are required');
    }

    return this.connectAndExecute(async () => {
      logger.info('Update script status', { meta: { scriptName, status, hasOption: option != null } });
      const updateFields = { status, ...(option != null && { savedOption: option }) };
      const result = await this.getScriptCollection().updateOne(
        { name: scriptName },
        { $set: updateFields }
      );
      
      if (result.matchedCount === 0) {
        throw new Error(`Script "${scriptName}" not found`);
      }
      return result;
    });
  }

  static async getScriptState(scriptName) {
    if (!scriptName) {
      throw new Error('Script name is required');
    }

    return this.connectAndExecute(async () => {
      logger.info('Get script state', { meta: { scriptName } });
      const script = await this.getScriptCollection().findOne({ name: scriptName });
      if (!script) {
        throw new Error(`Script "${scriptName}" not found`);
      }
      return script;
    });
  }

  static async getScriptStateLogs() {
    return this.connectAndExecute(async () => {
      const scripts = await this.getScriptCollection().find({}, {
        projection: { name: 1, logs: 1 }
      }).toArray();

      if (!scripts?.length) {
        return [];
      }

      const rows = scripts
        .flatMap(script => (script.logs || [])
          .map(log => ({
            ScriptName: script.name,
            Start: new Date(log.startTime),
            End: new Date(log.endTime),
            Duration: this.calculateDuration(log.startTime, log.endTime),
            Status: log.status,
            APICalls: log.apicalls || 0
          })))
        .sort((a, b) => a.Start - b.Start);
      logger.info('Get script state logs', { meta: { scripts: scripts.length, rows: rows.length } });
      return rows;
    });
  }

  static calculateDuration(startTime, endTime) {
    const duration = new Date(endTime) - new Date(startTime);
    return duration > 0 ? duration / 60000 : 0;
  }

  static async logScriptStart(scriptName) {
    if (!scriptName) {
      throw new Error('Script name is required');
    }

    const logEntry = {
      logId: new mongoose.Types.ObjectId(),
      status: 2,
      startTime: new Date(),
    };

    return this.connectAndExecute(async () => {
      await this.getScriptCollection().updateOne(
        { name: scriptName },
        { $push: { logs: logEntry } }
      );
      logger.info('Script log start', { meta: { scriptName, logId: logEntry.logId } });
      return logEntry.logId;
    });
  }

  static async updateLogStatus(scriptName, logId, status, message, apiCalls = 0) {
    if (!scriptName || !logId) {
      throw new Error('Script name and logId are required');
    }

    return this.connectAndExecute(async () => {
      const result = await this.getScriptCollection().updateOne(
        { name: scriptName, 'logs.logId': logId },
        {
          $set: {
            'logs.$.status': status,
            'logs.$.endTime': new Date(),
            'logs.$.message': message,
            'logs.$.apicalls': apiCalls,
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Log entry not found');
      }
      logger.info('Script log updated', { meta: { scriptName, logId, status } });
      return logId;
    });
  }

  static async getListScripts() {
    return this.connectAndExecute(async () => {
      // Fetch scripts
      const scripts = await this.getScriptCollection()
        .find({})
        .project({
          name: 1,
          status: 1,
          'execution_history': { $slice: -1 }
        })
        .toArray();

      // Fetch cron configs to merge real-time data
      const cronConfigs = await CronConfigRepository.findAll();

      const mapped = scripts.map(script => {
        // Find relevant cron config:
        // 1. Match by name (legacy/direct mapping)
        // 2. Check if script is included in a cron config's scripts list
        const relevantConfig = cronConfigs.find(config => 
          config.name === script.name || 
          (config.scripts && Array.isArray(config.scripts) && config.scripts.some(s => s.name === script.name))
        );

        return {
          ...script,
          lastExecution: script.execution_history?.[0]?.endTime || null,
          execution_history: undefined,
          // Include cron information from the actual CronConfig repository
          cronEnabled: relevantConfig?.enabled || false,
          cronSchedule: relevantConfig?.schedule || null,
          cronDescription: relevantConfig?.description || '',
          cronCategory: relevantConfig?.category || 'sync',
          cronRunCount: relevantConfig?.runCount || 0,
          cronLastRun: relevantConfig?.lastRun || null,
          cronFrequency: this.parseCronFrequency(relevantConfig?.schedule)
        };
      });
      
      logger.info('Get list scripts', { meta: { count: mapped.length } });
      return mapped;
    });
  }

  static async getScriptsDashboardView() {
    return this.connectAndExecute(async () => {
      // Fetch all scripts and cron configs
      const [scripts, cronConfigs] = await Promise.all([
        this.getScriptCollection().find({}).toArray(),
        CronConfigRepository.findAll()
      ]);
      
      // Create maps for easy lookup
      const scriptMap = new Map(scripts.map(s => [s.name, s]));
      const configMap = new Map(cronConfigs.map(c => [c.name, c]));

      // Get all unique names
      const allNames = new Set([...scriptMap.keys(), ...configMap.keys()]);

      // Map to dashboard view
      const dashboardView = Array.from(allNames).map((name, index) => {
        const script = scriptMap.get(name);
        const config = configMap.get(name);
        
        // Get last log for execution details
        const lastLog = script?.logs && script.logs.length > 0 
          ? script.logs[script.logs.length - 1] 
          : null;

        return {
          id: script?._id || `config-${index}`,
          nom: name,
          option: script?.savedOption || 'N/A',
          frequence: config ? this.parseCronFrequency(config.schedule) : 'Manuelle',
          derniere_execution: lastLog ? lastLog.endTime : null,
          date_de_lancement: lastLog ? lastLog.startTime : null,
          status: lastLog ? lastLog.status : 'Inconnu',
          raw_schedule: config ? config.schedule : null,
          is_enabled: config ? config.enabled : false,
          execution_count: script?.logs?.length || 0
        };
      });

      return dashboardView;
    });
  }

  static parseCronFrequency(schedule) {
    if (!schedule) return 'Manual';
    
    // Parse common cron patterns to human-readable frequency
    const patterns = {
      '*/5 * * * *': 'Every 5 minutes',
      '*/10 * * * *': 'Every 10 minutes',
      '*/15 * * * *': 'Every 15 minutes',
      '*/30 * * * *': 'Every 30 minutes',
      '0 * * * *': 'Every hour',
      '0 */2 * * *': 'Every 2 hours',
      '0 */4 * * *': 'Every 4 hours',
      '0 */6 * * *': 'Every 6 hours',
      '0 */12 * * *': 'Every 12 hours',
      '0 0 * * *': 'Daily at midnight',
      '0 1 * * *': 'Daily at 1 AM',
      '0 3 * * *': 'Daily at 3 AM',
      '0 5 * * *': 'Daily at 5 AM',
      '0 19 * * *': 'Daily at 7 PM',
      '0 0 * * 0': 'Weekly on Sunday',
      '0 0 * * 6': 'Weekly on Saturday',
      '0 0 1 * *': 'Monthly on 1st',
      '0 0 1 1 *': 'Yearly on Jan 1st'
    };
    
    return patterns[schedule] || schedule;
  }

  static async logExecutionHistory(name, startTime, endTime, status, message) {
    if (!name) {
      throw new Error('Script name is required');
    }

    const historyData = {
      status: status,
      endTime: endTime,
      startTime: startTime,
      message: message,
    };

    return this.connectAndExecute(async () => {
      const result = await this.getScriptCollection().updateOne(
        { name: name },
        { $push: { execution_history: historyData } }
      );

      if (result.matchedCount === 0) {
        throw new Error(`Script "${name}" not found`);
      }
      logger.info('Logged execution history', { meta: { name, status } });
      return result;
    });
  }

  /**
   * Mark scripts that have been "In Progress" (status: 2) for more than 3 days as "Failed" (status: -1)
   * @returns {Promise<Object>} Object with counts of updated logs
   */
  static async markStaleInProgressScriptsAsFailed() {
    return this.connectAndExecute(async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      logger.info('Marking stale in-progress scripts as failed', { 
        meta: { thresholdDate: threeDaysAgo.toISOString() } 
      });

      // Find all scripts with logs that have status 2 (In Progress) and startTime older than 3 days
      const scripts = await this.getScriptCollection().find({
        'logs': {
          $elemMatch: {
            status: 2, // In Progress
            startTime: { $lt: threeDaysAgo }
          }
        }
      }).toArray();

      let totalUpdated = 0;
      const updatedScripts = [];

      for (const script of scripts) {
        let scriptUpdated = false;
        
        // Update each stale log in the script
        for (const log of script.logs) {
          if (log.status === 2 && new Date(log.startTime) < threeDaysAgo) {
            await this.getScriptCollection().updateOne(
              { 
                _id: script._id,
                'logs.logId': log.logId 
              },
              {
                $set: {
                  'logs.$.status': -1,
                  'logs.$.endTime': new Date(),
                  'logs.$.message': 'Script marked as failed - exceeded 3 day timeout'
                }
              }
            );
            totalUpdated++;
            scriptUpdated = true;
            
            logger.info('Marked stale log as failed', { 
              meta: { 
                scriptName: script.name, 
                logId: log.logId,
                startTime: log.startTime 
              } 
            });
          }
        }

        if (scriptUpdated) {
          updatedScripts.push(script.name);
        }
      }

      logger.info('Completed marking stale scripts as failed', { 
        meta: { 
          totalLogsUpdated: totalUpdated,
          scriptsAffected: updatedScripts.length,
          scriptNames: updatedScripts
        } 
      });

      return {
        totalLogsUpdated: totalUpdated,
        scriptsAffected: updatedScripts.length,
        scriptNames: updatedScripts,
        thresholdDate: threeDaysAgo
      };
    });
  }
}

module.exports = ScriptService;