const { ObjectId } = require('mongodb');
const MongoDB = require('../utils/mongodb');

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
      await MongoDB.connectToDatabase();
      return await callback();
    } catch (error) {
      console.error('Database operation failed:', error.message);
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

      return scripts
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
          'execution_history': { $slice: -1 }
        })
        .toArray();

      return scripts.map(script => ({
        ...script,
        lastExecution: script.execution_history?.[0]?.endTime || null,
        execution_history: undefined
      }));
    });
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
      return result;
    });
  }
}

module.exports = ScriptService;