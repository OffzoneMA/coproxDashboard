/**
 * Domain Model for CronConfig
 * Pure domain model following hexagonal architecture principles
 * No database dependencies - just domain logic and validation
 */

class CronScript {
  constructor(data = {}) {
    this.name = data.name || '';
    this.modulePath = data.modulePath || '';
    this.enabled = data.enabled !== undefined ? data.enabled : true;
    this.order = data.order || 0;
  }

  /**
   * Validate script configuration
   */
  validate() {
    const errors = [];
    
    if (!this.name || typeof this.name !== 'string') {
      errors.push('Script name is required and must be a string');
    }
    
    if (!this.modulePath || typeof this.modulePath !== 'string') {
      errors.push('Script module path is required and must be a string');
    }
    
    if (typeof this.enabled !== 'boolean') {
      errors.push('Script enabled must be a boolean');
    }
    
    if (typeof this.order !== 'number' || this.order < 0) {
      errors.push('Script order must be a non-negative number');
    }
    
    return errors;
  }

  /**
   * Check if script is enabled
   */
  isEnabled() {
    return this.enabled === true;
  }
}

class CronConfig {
  constructor(data = {}) {
    this.name = data.name || '';
    this.schedule = data.schedule || '';
    this.enabled = data.enabled !== undefined ? data.enabled : true;
    this.timezone = data.timezone || 'Etc/UTC';
    this.description = data.description || '';
    
    // Convert scripts array to CronScript instances
    this.scripts = (data.scripts || []).map(script => 
      script instanceof CronScript ? script : new CronScript(script)
    );
    
    this.category = data.category || 'other';
    this.priority = data.priority || 1;
    this.lastRun = data.lastRun ? new Date(data.lastRun) : null;
    this.nextRun = data.nextRun ? new Date(data.nextRun) : null;
    this.runCount = data.runCount || 0;
    this.errorCount = data.errorCount || 0;
    this.averageRunTime = data.averageRunTime || 0;
    this.maxRetries = data.maxRetries || 3;
    this.retryDelay = data.retryDelay || 60000;
    this.timeout = data.timeout || 3600000;
    
    this.notifications = {
      onSuccess: false,
      onError: true,
      recipients: [],
      ...(data.notifications || {})
    };
    
    this.metadata = new Map(data.metadata || []);
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  /**
   * Validate cron configuration
   */
  validate() {
    const errors = [];
    
    if (!this.name || typeof this.name !== 'string') {
      errors.push('Name is required and must be a string');
    }
    
    if (!this.schedule || typeof this.schedule !== 'string') {
      errors.push('Schedule is required and must be a string');
    } else {
      // Basic cron expression validation
      const parts = this.schedule.trim().split(/\s+/);
      if (parts.length !== 5 && parts.length !== 6) {
        errors.push('Schedule must be a valid cron expression (5 or 6 parts)');
      }
    }
    
    if (typeof this.enabled !== 'boolean') {
      errors.push('Enabled must be a boolean');
    }
    
    if (!['sync', 'maintenance', 'monitoring', 'backup', 'other'].includes(this.category)) {
      errors.push('Category must be one of: sync, maintenance, monitoring, backup, other');
    }
    
    if (typeof this.priority !== 'number' || this.priority < 1 || this.priority > 10) {
      errors.push('Priority must be a number between 1 and 10');
    }
    
    // Validate scripts
    this.scripts.forEach((script, index) => {
      const scriptErrors = script.validate();
      scriptErrors.forEach(error => {
        errors.push(`Script ${index + 1}: ${error}`);
      });
    });
    
    return errors;
  }

  /**
   * Check if configuration is valid
   */
  isValid() {
    return this.validate().length === 0;
  }

  /**
   * Check if cron job is enabled
   */
  isEnabled() {
    return this.enabled === true;
  }

  /**
   * Get enabled scripts sorted by order
   */
  getEnabledScripts() {
    return this.scripts
      .filter(script => script.isEnabled())
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Add a script to the configuration
   */
  addScript(scriptData) {
    const script = new CronScript(scriptData);
    const errors = script.validate();
    
    if (errors.length > 0) {
      throw new Error(`Invalid script configuration: ${errors.join(', ')}`);
    }
    
    // Check for duplicate names
    if (this.scripts.find(s => s.name === script.name)) {
      throw new Error(`Script with name '${script.name}' already exists`);
    }
    
    this.scripts.push(script);
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Remove a script by name
   */
  removeScript(scriptName) {
    const index = this.scripts.findIndex(s => s.name === scriptName);
    if (index === -1) {
      throw new Error(`Script '${scriptName}' not found`);
    }
    
    this.scripts.splice(index, 1);
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Update a script
   */
  updateScript(scriptName, updates) {
    const script = this.scripts.find(s => s.name === scriptName);
    if (!script) {
      throw new Error(`Script '${scriptName}' not found`);
    }
    
    Object.assign(script, updates);
    const errors = script.validate();
    
    if (errors.length > 0) {
      throw new Error(`Invalid script update: ${errors.join(', ')}`);
    }
    
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Update run statistics
   */
  updateRunStats(runTime, success = true) {
    this.runCount++;
    this.lastRun = new Date();
    
    if (!success) {
      this.errorCount++;
    }
    
    if (runTime && runTime > 0) {
      // Calculate moving average
      if (this.runCount === 1) {
        this.averageRunTime = runTime;
      } else {
        this.averageRunTime = Math.round(
          ((this.averageRunTime * (this.runCount - 1)) + runTime) / this.runCount
        );
      }
    }
    
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Calculate error rate
   */
  getErrorRate() {
    if (this.runCount === 0) return 0;
    return this.errorCount / this.runCount;
  }

  /**
   * Check if error rate is above threshold
   */
  hasHighErrorRate(threshold = 0.1) {
    return this.getErrorRate() > threshold;
  }

  /**
   * Get formatted next run time
   */
  getNextRunFormatted() {
    return this.nextRun ? this.nextRun.toISOString() : null;
  }

  /**
   * Convert to plain object for database storage
   */
  toObject() {
    return {
      name: this.name,
      schedule: this.schedule,
      enabled: this.enabled,
      timezone: this.timezone,
      description: this.description,
      scripts: this.scripts.map(script => ({
        name: script.name,
        modulePath: script.modulePath,
        enabled: script.enabled,
        order: script.order
      })),
      category: this.category,
      priority: this.priority,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      runCount: this.runCount,
      errorCount: this.errorCount,
      averageRunTime: this.averageRunTime,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      timeout: this.timeout,
      notifications: this.notifications,
      metadata: Array.from(this.metadata.entries()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create instance from database object
   */
  static fromObject(data) {
    return new CronConfig(data);
  }
}

module.exports = { CronConfig, CronScript };