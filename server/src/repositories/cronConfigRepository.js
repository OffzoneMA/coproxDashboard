const MongoDB = require('../utils/mongodb');
const { createServiceLogger } = require('../services/logger');
const { logger, logError } = createServiceLogger('cronConfigRepository');

/**
 * Repository (Infrastructure Layer) for CronConfig operations
 * This follows the hexagonal architecture pattern as an adapter
 */
class CronConfigRepository {
  
  /**
   * Connect to database and execute operation
   * @param {Function} operation - Database operation to execute
   * @returns {Promise} Operation result
   */
  static async executeOperation(operation) {
    try {
      await MongoDB.connectToDatabase();
      const result = await operation();
      return result;
    } catch (error) {
      logError(error, 'CronConfig repository operation failed');
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Get the CronConfig collection
   * @returns {Object} MongoDB collection
   */
  static getCollection() {
    return MongoDB.getCollection('cronconfigs');
  }

  /**
   * Find all cron configurations with optional filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (sort, limit, etc.)
   * @returns {Promise<Array>} Array of configurations
   */
  static async findAll(filter = {}, options = {}) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      let query = collection.find(filter);
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }

      const results = await query.toArray();
      logger.info('Found cron configurations', { 
        meta: { count: results.length, filter } 
      });
      return results;
    });
  }

  /**
   * Find one cron configuration by filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<Object|null>} Configuration or null
   */
  static async findOne(filter) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      const result = await collection.findOne(filter);
      logger.info('Found single cron configuration', { 
        meta: { found: !!result, filter } 
      });
      return result;
    });
  }

  /**
   * Find cron configuration by name
   * @param {string} name - Configuration name
   * @returns {Promise<Object|null>} Configuration or null
   */
  static async findByName(name) {
    return this.findOne({ name: name });
  }

  /**
   * Insert a new cron configuration
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} Inserted configuration with _id
   */
  static async insertOne(configData) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      
      // Add timestamps
      const dataWithTimestamps = {
        ...configData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(dataWithTimestamps);
      const inserted = await collection.findOne({ _id: result.insertedId });
      
      logger.info('Inserted cron configuration', { 
        meta: { name: configData.name, id: result.insertedId } 
      });
      return inserted;
    });
  }

  /**
   * Update a cron configuration
   * @param {Object} filter - Filter to find document
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  static async updateOne(filter, updateData) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      
      // Add update timestamp
      const dataWithTimestamp = {
        ...updateData,
        updatedAt: new Date()
      };

      const result = await collection.updateOne(
        filter,
        { $set: dataWithTimestamp }
      );
      
      logger.info('Updated cron configuration', { 
        meta: { filter, modifiedCount: result.modifiedCount } 
      });
      return result;
    });
  }

  /**
   * Update configuration by name
   * @param {string} name - Configuration name
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated configuration
   */
  static async updateByName(name, updateData) {
    const result = await this.updateOne({ name: name }, updateData);
    
    if (result.matchedCount === 0) {
      throw new Error(`CronConfig with name '${name}' not found`);
    }
    
    return this.findByName(name);
  }

  /**
   * Delete a cron configuration
   * @param {Object} filter - Filter to find document
   * @returns {Promise<Object>} Delete result
   */
  static async deleteOne(filter) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      const result = await collection.deleteOne(filter);
      
      logger.info('Deleted cron configuration', { 
        meta: { filter, deletedCount: result.deletedCount } 
      });
      return result;
    });
  }

  /**
   * Delete configuration by name
   * @param {string} name - Configuration name
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteByName(name) {
    const result = await this.deleteOne({ name: name });
    
    if (result.deletedCount === 0) {
      throw new Error(`CronConfig with name '${name}' not found`);
    }
    
    return true;
  }

  /**
   * Count documents matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} Document count
   */
  static async countDocuments(filter = {}) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      const count = await collection.countDocuments(filter);
      
      logger.info('Counted cron configurations', { 
        meta: { count, filter } 
      });
      return count;
    });
  }

  /**
   * Add script to configuration's scripts array
   * @param {string} name - Configuration name
   * @param {Object} scriptConfig - Script configuration
   * @returns {Promise<Object>} Updated configuration
   */
  static async addScript(name, scriptConfig) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { name: name },
        { 
          $push: { scripts: scriptConfig },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error(`CronConfig with name '${name}' not found`);
      }

      const updated = await collection.findOne({ name: name });
      logger.info('Added script to cron configuration', { 
        meta: { cronName: name, scriptName: scriptConfig.name } 
      });
      return updated;
    });
  }

  /**
   * Remove script from configuration's scripts array
   * @param {string} name - Configuration name
   * @param {string} scriptName - Script name to remove
   * @returns {Promise<Object>} Updated configuration
   */
  static async removeScript(name, scriptName) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { name: name },
        { 
          $pull: { scripts: { name: scriptName } },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error(`CronConfig with name '${name}' not found`);
      }

      const updated = await collection.findOne({ name: name });
      logger.info('Removed script from cron configuration', { 
        meta: { cronName: name, scriptName } 
      });
      return updated;
    });
  }

  /**
   * Update script within configuration
   * @param {string} name - Configuration name
   * @param {string} scriptName - Script name to update
   * @param {Object} updates - Script updates
   * @returns {Promise<Object>} Updated configuration
   */
  static async updateScript(name, scriptName, updates) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      
      const updateFields = {};
      Object.keys(updates).forEach(key => {
        updateFields[`scripts.$.${key}`] = updates[key];
      });
      updateFields.updatedAt = new Date();

      const result = await collection.updateOne(
        { name: name, 'scripts.name': scriptName },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        throw new Error(`Script '${scriptName}' not found in CronConfig '${name}'`);
      }

      const updated = await collection.findOne({ name: name });
      logger.info('Updated script in cron configuration', { 
        meta: { cronName: name, scriptName, updates: Object.keys(updates) } 
      });
      return updated;
    });
  }

  /**
   * Update run statistics
   * @param {string} name - Configuration name
   * @param {Object} stats - Statistics to update
   * @returns {Promise<Object>} Updated configuration
   */
  static async updateRunStats(name, stats) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      
      const updateFields = {
        $set: {
          lastRun: new Date(),
          updatedAt: new Date()
        },
        $inc: {}
      };

      if (stats.runCount !== undefined) {
        updateFields.$inc.runCount = stats.runCount;
      }

      if (stats.errorCount !== undefined) {
        updateFields.$inc.errorCount = stats.errorCount;
      }

      if (stats.averageRunTime !== undefined) {
        updateFields.$set.averageRunTime = stats.averageRunTime;
      }

      const result = await collection.updateOne(
        { name: name },
        updateFields
      );

      if (result.matchedCount === 0) {
        throw new Error(`CronConfig with name '${name}' not found`);
      }

      const updated = await collection.findOne({ name: name });
      logger.info('Updated cron run statistics', { 
        meta: { name, stats } 
      });
      return updated;
    });
  }

  /**
   * Get configurations with high error rates
   * @param {number} threshold - Error rate threshold (0-1)
   * @returns {Promise<Array>} Configurations with high error rates
   */
  static async findHighErrorRateConfigs(threshold = 0.1) {
    return this.executeOperation(async () => {
      const collection = this.getCollection();
      
      const results = await collection.find({
        runCount: { $gt: 0 },
        $expr: {
          $gt: [
            { $divide: ['$errorCount', '$runCount'] },
            threshold
          ]
        }
      }).toArray();

      logger.info('Found high error rate configurations', { 
        meta: { count: results.length, threshold } 
      });
      return results;
    });
  }

  /**
   * Get configurations due to run (for future implementation)
   * @returns {Promise<Array>} Configurations due to run
   */
  static async findDueConfigs() {
    const now = new Date();
    return this.findAll({ 
      enabled: true,
      $or: [
        { nextRun: { $lte: now } },
        { nextRun: { $exists: false } }
      ]
    });
  }
}

module.exports = CronConfigRepository;