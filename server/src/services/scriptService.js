const { ObjectId } = require('mongodb');
const MongoDB = require('../utils/mongodb');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('script');

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
      logId: new ObjectId(),
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
      const scripts = await this.getScriptCollection()
        .find({})
        .project({
          name: 1,
          status: 1,
          'execution_history': { $slice: -1 },
          cronConfig: 1
        })
        .toArray();

      const mapped = scripts.map(script => ({
        ...script,
        lastExecution: script.execution_history?.[0]?.endTime || null,
        execution_history: undefined,
        // Include cron information directly in script response
        cronEnabled: script.cronConfig?.enabled || false,
        cronSchedule: script.cronConfig?.schedule || null,
        cronDescription: script.cronConfig?.description || '',
        cronCategory: script.cronConfig?.category || 'sync',
        cronRunCount: script.cronConfig?.runCount || 0,
        cronLastRun: script.cronConfig?.lastRun || null,
        cronFrequency: this.parseCronFrequency(script.cronConfig?.schedule)
      }));
      logger.info('Get list scripts', { meta: { count: mapped.length } });
      return mapped;
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
}

module.exports = ScriptService;