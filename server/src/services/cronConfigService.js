const CronConfigRepository = require('../repositories/cronConfigRepository');
const { createServiceLogger } = require('./logger');
const { logger, logError } = createServiceLogger('cronConfig');
const cron = require('node-cron');

/**
 * Service class for managing cron job configurations
 */
class CronConfigService {
  


  /**
   * Validate cron expression
   * @param {string} cronExpression - The cron expression to validate
   * @returns {boolean} True if valid, throws error if invalid
   */
  static validateCronExpression(cronExpression) {
    try {
      if (!cronExpression || typeof cronExpression !== 'string') {
        throw new Error('Cron expression must be a non-empty string');
      }
      
      // Use node-cron's validate function
      const isValid = cron.validate(cronExpression);
      if (!isValid) {
        throw new Error('Invalid cron expression format');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Cron expression validation failed: ${error.message}`);
    }
  }

  /**
   * Get all cron configurations
   * @param {Object} filter - Optional filter criteria
   * @returns {Promise<Array>} Array of cron configurations
   */
  static async getAllConfigs(filter = {}) {
    try {
      const configs = await CronConfigRepository.findAll(filter, {
        sort: { priority: -1, name: 1 }
      });
      
      logger.info('Retrieved cron configurations', { 
        meta: { count: configs.length, filter } 
      });
      return configs;
    } catch (error) {
      logError(error, 'Failed to get all cron configurations');
      throw new Error(`Failed to get cron configurations: ${error.message}`);
    }
  }

  /**
   * Get enabled cron configurations only
   * @returns {Promise<Array>} Array of enabled cron configurations
   */
  static async getEnabledConfigs() {
    return this.getAllConfigs({ enabled: true });
  }

  /**
   * Get cron configuration by name
   * @param {string} name - The name of the cron configuration
   * @returns {Promise<Object|null>} Cron configuration or null if not found
   */
  static async getConfigByName(name) {
    if (!name) {
      throw new Error('Cron configuration name is required');
    }

    try {
      const config = await CronConfigRepository.findByName(name);
      
      logger.info('Retrieved cron configuration by name', { 
        meta: { name, found: !!config } 
      });
      return config;
    } catch (error) {
      logError(error, `Failed to get cron configuration by name: ${name}`);
      throw new Error(`Failed to get cron configuration '${name}': ${error.message}`);
    }
  }

  /**
   * Create a new cron configuration
   * @param {Object} configData - The cron configuration data
   * @returns {Promise<Object>} Created cron configuration
   */
  static async createConfig(configData) {
    if (!configData.name || !configData.schedule) {
      throw new Error('Name and schedule are required for cron configuration');
    }

    // Validate cron expression
    this.validateCronExpression(configData.schedule);

    try {
      // Check if config with same name already exists
      const existing = await CronConfigRepository.findByName(configData.name);
      if (existing) {
        throw new Error(`Cron configuration with name '${configData.name}' already exists`);
      }

      const config = {
        ...configData,
        runCount: 0,
        errorCount: 0,
        averageRunTime: 0
      };

      const insertedConfig = await CronConfigRepository.insertOne(config);

      logger.info('Created cron configuration', { 
        meta: { name: configData.name, id: insertedConfig._id } 
      });
      return insertedConfig;
    } catch (error) {
      logError(error, `Failed to create cron configuration: ${configData.name}`);
      throw new Error(`Failed to create cron configuration: ${error.message}`);
    }
  }

  /**
   * Update a cron configuration
   * @param {string} name - The name of the cron configuration to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} Updated cron configuration
   */
  static async updateConfig(name, updateData) {
    if (!name) {
      throw new Error('Cron configuration name is required');
    }

    // Validate cron expression if it's being updated
    if (updateData.schedule) {
      this.validateCronExpression(updateData.schedule);
    }

    try {
      const updatedConfig = await CronConfigRepository.updateByName(name, updateData);

      logger.info('Updated cron configuration', { 
        meta: { name, updated: true } 
      });
      return updatedConfig;
    } catch (error) {
      logError(error, `Failed to update cron configuration: ${name}`);
      throw new Error(`Failed to update cron configuration: ${error.message}`);
    }
  }

  /**
   * Delete a cron configuration
   * @param {string} name - The name of the cron configuration to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async deleteConfig(name) {
    if (!name) {
      throw new Error('Cron configuration name is required');
    }

    try {
      const deleted = await CronConfigRepository.deleteByName(name);

      logger.info('Deleted cron configuration', { meta: { name } });
      return deleted;
    } catch (error) {
      logError(error, `Failed to delete cron configuration: ${name}`);
      throw new Error(`Failed to delete cron configuration: ${error.message}`);
    }
  }

  /**
   * Enable or disable a cron configuration
   * @param {string} name - The name of the cron configuration
   * @param {boolean} enabled - Whether to enable or disable
   * @returns {Promise<Object>} Updated cron configuration
   */
  static async setEnabled(name, enabled) {
    if (!name || typeof enabled !== 'boolean') {
      throw new Error('Name and enabled status are required');
    }

    return this.updateConfig(name, { enabled: enabled });
  }

  /**
   * Add a script to a cron configuration
   * @param {string} cronName - The name of the cron configuration
   * @param {Object} scriptConfig - The script configuration to add
   * @returns {Promise<Object>} Updated cron configuration
   */
  static async addScript(cronName, scriptConfig) {
    if (!cronName || !scriptConfig.name || !scriptConfig.modulePath) {
      throw new Error('Cron name, script name, and module path are required');
    }

    try {
      const config = await CronConfigRepository.findByName(cronName);
      if (!config) {
        throw new Error(`Cron configuration '${cronName}' not found`);
      }

      // Check if script already exists
      const existingScript = config.scripts?.find(s => s.name === scriptConfig.name);
      if (existingScript) {
        throw new Error(`Script '${scriptConfig.name}' already exists in cron '${cronName}'`);
      }

      const updatedConfig = await CronConfigRepository.addScript(cronName, scriptConfig);

      logger.info('Added script to cron configuration', { 
        meta: { cronName, scriptName: scriptConfig.name } 
      });
      return updatedConfig;
    } catch (error) {
      logError(error, `Failed to add script to cron configuration: ${cronName}`);
      throw new Error(`Failed to add script: ${error.message}`);
    }
  }

  /**
   * Remove a script from a cron configuration
   * @param {string} cronName - The name of the cron configuration
   * @param {string} scriptName - The name of the script to remove
   * @returns {Promise<Object>} Updated cron configuration
   */
  static async removeScript(cronName, scriptName) {
    if (!cronName || !scriptName) {
      throw new Error('Cron name and script name are required');
    }

    try {
      const updatedConfig = await CronConfigRepository.removeScript(cronName, scriptName);

      logger.info('Removed script from cron configuration', { 
        meta: { cronName, scriptName } 
      });
      return updatedConfig;
    } catch (error) {
      logError(error, `Failed to remove script from cron configuration: ${cronName}`);
      throw new Error(`Failed to remove script: ${error.message}`);
    }
  }

  /**
   * Update script configuration within a cron
   * @param {string} cronName - The name of the cron configuration
   * @param {string} scriptName - The name of the script to update
   * @param {Object} updates - The updates to apply to the script
   * @returns {Promise<Object>} Updated cron configuration
   */
  static async updateScript(cronName, scriptName, updates) {
    if (!cronName || !scriptName) {
      throw new Error('Cron name and script name are required');
    }

    try {
      const updatedConfig = await CronConfigRepository.updateScript(cronName, scriptName, updates);

      logger.info('Updated script in cron configuration', { 
        meta: { cronName, scriptName, updates: Object.keys(updates) } 
      });
      return updatedConfig;
    } catch (error) {
      logError(error, `Failed to update script in cron configuration: ${cronName}`);
      throw new Error(`Failed to update script: ${error.message}`);
    }
  }

  /**
   * Update run statistics for a cron configuration
   * @param {string} name - The name of the cron configuration
   * @param {number} runTime - The runtime in milliseconds
   * @param {boolean} success - Whether the run was successful
   * @returns {Promise<Object>} Updated cron configuration
   */
  static async updateRunStats(name, runTime, success = true) {
    if (!name) {
      throw new Error('Cron configuration name is required');
    }

    try {
      const stats = {
        runCount: 1
      };

      if (!success) {
        stats.errorCount = 1;
      }

      if (runTime && runTime > 0) {
        // Simple moving average calculation
        const config = await CronConfigRepository.findByName(name);
        if (config) {
          const currentAvg = config.averageRunTime || 0;
          const runCount = config.runCount || 0;
          const newAvg = runCount > 0 ? 
            ((currentAvg * runCount) + runTime) / (runCount + 1) : 
            runTime;
          stats.averageRunTime = Math.round(newAvg);
        }
      }

      const updatedConfig = await CronConfigRepository.updateRunStats(name, stats);

      logger.info('Updated cron run statistics', { 
        meta: { name, runTime, success, runCount: updatedConfig.runCount } 
      });
      return updatedConfig;
    } catch (error) {
      logError(error, `Failed to update run statistics for cron configuration: ${name}`);
      throw new Error(`Failed to update run statistics: ${error.message}`);
    }
  }

  /**
   * Get cron configurations by category
   * @param {string} category - The category to filter by
   * @returns {Promise<Array>} Array of cron configurations
   */
  static async getConfigsByCategory(category) {
    return this.getAllConfigs({ category: category });
  }

  /**
   * Get configurations that are due to run
   * @returns {Promise<Array>} Array of configurations due to run
   */
  static async getDueConfigs() {
    try {
      const configs = await CronConfigRepository.findDueConfigs();
      
      logger.info('Retrieved due cron configurations', { 
        meta: { count: configs.length } 
      });
      return configs;
    } catch (error) {
      logError(error, 'Failed to get due cron configurations');
      throw new Error(`Failed to get due configurations: ${error.message}`);
    }
  }

  /**
   * Reset error count for a cron configuration
   * @param {string} name - The name of the cron configuration
   * @returns {Promise<Object>} Updated cron configuration
   */
  static async resetErrorCount(name) {
    return this.updateConfig(name, { errorCount: 0 });
  }

  /**
   * Get cron configurations with high error rates
   * @param {number} threshold - Error rate threshold (default: 0.1 = 10%)
   * @returns {Promise<Array>} Array of configurations with high error rates
   */
  static async getHighErrorRateConfigs(threshold = 0.1) {
    try {
      const configs = await CronConfigRepository.findHighErrorRateConfigs(threshold);

      logger.info('Retrieved high error rate configurations', { 
        meta: { count: configs.length, threshold } 
      });
      return configs;
    } catch (error) {
      logError(error, 'Failed to get high error rate configurations');
      throw new Error(`Failed to get high error rate configurations: ${error.message}`);
    }
  }
}

module.exports = CronConfigService;