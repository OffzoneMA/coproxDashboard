const CronConfigService = require('../services/cronConfigService');

/**
 * Controller for managing cron job configurations
 */
class CronConfigController {
  
  /**
   * Generic response handler
   * @param {Object} res - Express response object
   * @param {Function} operation - Async operation to execute
   * @returns {Object} JSON response
   */
  static async sendResponse(res, operation) {
    try {
      const data = await operation();
      return res.status(200).json({ 
        success: true, 
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`CronConfig operation failed: ${error.message}`);
      
      // Determine appropriate status code based on error message
      let statusCode = 500;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('already exists') || 
                 error.message.includes('required') ||
                 error.message.includes('Invalid')) {
        statusCode = 400;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get all cron configurations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllConfigs(req, res) {
    const { category, enabled } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (enabled !== undefined) filter.enabled = enabled === 'true';

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.getAllConfigs(filter)
    );
  }

  /**
   * Get enabled cron configurations only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getEnabledConfigs(req, res) {
    return CronConfigController.sendResponse(res, () => 
      CronConfigService.getEnabledConfigs()
    );
  }

  /**
   * Get cron configuration by name
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getConfigByName(req, res) {
    const { name } = req.params;
    
    return CronConfigController.sendResponse(res, () => 
      CronConfigService.getConfigByName(name)
    );
  }

  /**
   * Create a new cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createConfig(req, res) {
    const configData = req.body;

    // Validate required fields
    if (!configData.name || !configData.schedule) {
      return res.status(400).json({
        success: false,
        error: 'Name and schedule are required',
        timestamp: new Date().toISOString()
      });
    }

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.createConfig(configData)
    );
  }

  /**
   * Update a cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateConfig(req, res) {
    const { name } = req.params;
    const updateData = req.body;

    // Remove name from update data to prevent accidental changes
    delete updateData.name;
    delete updateData._id;
    delete updateData.createdAt;

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.updateConfig(name, updateData)
    );
  }

  /**
   * Delete a cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteConfig(req, res) {
    const { name } = req.params;

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.deleteConfig(name)
    );
  }

  /**
   * Enable or disable a cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async setEnabled(req, res) {
    const { name } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Enabled status must be a boolean',
        timestamp: new Date().toISOString()
      });
    }

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.setEnabled(name, enabled)
    );
  }

  /**
   * Add a script to a cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async addScript(req, res) {
    const { name } = req.params;
    const scriptConfig = req.body;

    // Validate required fields for script
    if (!scriptConfig.name || !scriptConfig.modulePath) {
      return res.status(400).json({
        success: false,
        error: 'Script name and module path are required',
        timestamp: new Date().toISOString()
      });
    }

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.addScript(name, scriptConfig)
    );
  }

  /**
   * Remove a script from a cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async removeScript(req, res) {
    const { name, scriptName } = req.params;

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.removeScript(name, scriptName)
    );
  }

  /**
   * Update a script within a cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateScript(req, res) {
    const { name, scriptName } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.name;
    delete updates._id;

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.updateScript(name, scriptName, updates)
    );
  }

  /**
   * Get configurations by category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getConfigsByCategory(req, res) {
    const { category } = req.params;

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.getConfigsByCategory(category)
    );
  }

  /**
   * Get configurations that are due to run
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getDueConfigs(req, res) {
    return CronConfigController.sendResponse(res, () => 
      CronConfigService.getDueConfigs()
    );
  }

  /**
   * Reset error count for a cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resetErrorCount(req, res) {
    const { name } = req.params;

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.resetErrorCount(name)
    );
  }

  /**
   * Get configurations with high error rates
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getHighErrorRateConfigs(req, res) {
    const { threshold = 0.1 } = req.query;

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.getHighErrorRateConfigs(parseFloat(threshold))
    );
  }

  /**
   * Update run statistics for a cron configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateRunStats(req, res) {
    const { name } = req.params;
    const { runTime, success = true } = req.body;

    return CronConfigController.sendResponse(res, () => 
      CronConfigService.updateRunStats(name, runTime, success)
    );
  }

  /**
   * Validate a cron expression
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async validateCronExpression(req, res) {
    const { expression } = req.body;

    if (!expression) {
      return res.status(400).json({
        success: false,
        error: 'Cron expression is required',
        timestamp: new Date().toISOString()
      });
    }

    return CronConfigController.sendResponse(res, () => {
      const isValid = CronConfigService.validateCronExpression(expression);
      return {
        expression: expression,
        valid: isValid,
        message: isValid ? 'Valid cron expression' : 'Invalid cron expression'
      };
    });
  }

  /**
   * Get cron configuration statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getStats(req, res) {
    return CronConfigController.sendResponse(res, async () => {
      const [allConfigs, enabledConfigs, highErrorConfigs] = await Promise.all([
        CronConfigService.getAllConfigs(),
        CronConfigService.getEnabledConfigs(),
        CronConfigService.getHighErrorRateConfigs(0.1)
      ]);

      const stats = {
        total: allConfigs.length,
        enabled: enabledConfigs.length,
        disabled: allConfigs.length - enabledConfigs.length,
        highErrorRate: highErrorConfigs.length,
        categories: {},
        totalRuns: 0,
        totalErrors: 0,
        averageRunTime: 0
      };

      // Calculate category distribution and aggregate stats
      allConfigs.forEach(config => {
        const category = config.category || 'other';
        stats.categories[category] = (stats.categories[category] || 0) + 1;
        stats.totalRuns += config.runCount || 0;
        stats.totalErrors += config.errorCount || 0;
        stats.averageRunTime += config.averageRunTime || 0;
      });

      // Calculate overall average run time
      if (allConfigs.length > 0) {
        stats.averageRunTime = Math.round(stats.averageRunTime / allConfigs.length);
      }

      // Calculate error rate
      stats.errorRate = stats.totalRuns > 0 ? 
        ((stats.totalErrors / stats.totalRuns) * 100).toFixed(2) + '%' : 
        '0%';

      return stats;
    });
  }

  /**
   * Bulk update multiple cron configurations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async bulkUpdate(req, res) {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required',
        timestamp: new Date().toISOString()
      });
    }

    return CronConfigController.sendResponse(res, async () => {
      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          if (!update.name) {
            throw new Error('Name is required for each update');
          }

          const result = await CronConfigService.updateConfig(update.name, update.data || {});
          results.push({ name: update.name, success: true, data: result });
        } catch (error) {
          errors.push({ name: update.name, success: false, error: error.message });
        }
      }

      return {
        successful: results,
        failed: errors,
        summary: {
          total: updates.length,
          successful: results.length,
          failed: errors.length
        }
      };
    });
  }

  /**
   * Seed default cron configurations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async seedConfigs(req, res) {
    return CronConfigController.sendResponse(res, async () => {
      const cronSeeder = require('../utils/cronSeeder');
      const result = await cronSeeder.fullSeed();
      
      return {
        message: 'Cron configuration seeding completed',
        ...result
      };
    });
  }

  /**
   * Reload cron jobs (trigger cron system to reload configurations)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async reloadCronJobs(req, res) {
    return CronConfigController.sendResponse(res, async () => {
      // Import scheduleCronJobs to access reload function
      const scheduleCronJobs = require('../cron/cronStart');
      
      if (typeof scheduleCronJobs.reload === 'function') {
        await scheduleCronJobs.reload();
        
        return {
          message: 'Cron jobs reloaded successfully',
          timestamp: new Date().toISOString(),
          activeJobs: scheduleCronJobs.getActiveJobs ? scheduleCronJobs.getActiveJobs() : []
        };
      } else {
        throw new Error('Cron reload function not available');
      }
    });
  }
}

module.exports = CronConfigController;