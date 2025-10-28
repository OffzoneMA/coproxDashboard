const CronConfigService = require('../services/cronConfigService');

/**
 * Default cron configurations based on existing hardcoded schedules
 */
const defaultCronConfigs = [
  {
    name: 'morning-sync-3am',
    schedule: '0 3 * * *',
    enabled: true,
    timezone: 'Etc/UTC',
    description: 'Morning synchronization tasks at 3 AM UTC',
    category: 'sync',
    priority: 8,
    scripts: [
      {
        name: 'synchroRapelles',
        modulePath: '../cron/synchroRapelles',
        enabled: true,
        order: 1
      },
      {
        name: 'synchroFacture',
        modulePath: '../cron/synchroFacture',
        enabled: true,
        order: 2
      },
      {
        name: 'zendeskTicket',
        modulePath: '../cron/zendeskTicket',
        enabled: true,
        order: 3
      },
      {
        name: 'recoverAllSuspendedTickets',
        modulePath: '../services/zendeskService',
        enabled: true,
        order: 4
      }
    ],
    timeout: 3600000, // 1 hour
    maxRetries: 2,
    notifications: {
      onError: true,
      onSuccess: false
    }
  },
  {
    name: 'early-morning-5am',
    schedule: '0 5 * * *',
    enabled: true,
    timezone: 'Etc/UTC',
    description: 'Early morning accounting synchronization at 5 AM UTC',
    category: 'sync',
    priority: 7,
    scripts: [
      {
        name: 'synchroComptaList401',
        modulePath: '../cron/synchroComptaList401',
        enabled: true,
        order: 1
      },
      {
        name: 'synchroComptaList472',
        modulePath: '../cron/synchroComptaList472',
        enabled: true,
        order: 2
      },
      {
        name: 'synchroComptaRapprochementBancaire',
        modulePath: '../cron/synchroComptaRapprochementBancaire',
        enabled: true,
        order: 3
      }
    ],
    timeout: 2700000, // 45 minutes
    maxRetries: 2,
    notifications: {
      onError: true,
      onSuccess: false
    }
  },
  {
    name: 'midnight-1am',
    schedule: '0 1 * * *',
    enabled: true,
    timezone: 'Etc/UTC',
    description: 'Midnight synchronization tasks at 1 AM UTC',
    category: 'sync',
    priority: 9,
    scripts: [
      {
        name: 'synchroMandats',
        modulePath: '../cron/synchroMandats',
        enabled: true,
        order: 1
      },
      {
        name: 'synchroContratEntretien',
        modulePath: '../cron/synchroContratEntretien',
        enabled: true,
        order: 2
      },
      {
        name: 'contratAssurance',
        modulePath: './synchroContratAssurance',
        enabled: true,
        order: 3
      },
      {
        name: 'synchroSuiviVieCopro',
        modulePath: '../cron/synchroSuiviVieCopro',
        enabled: true,
        order: 4
      }
    ],
    timeout: 3600000, // 1 hour
    maxRetries: 2,
    notifications: {
      onError: true,
      onSuccess: false
    }
  },
  {
    name: 'weekly-sunday',
    schedule: '0 0 * * 0',
    enabled: true,
    timezone: 'Etc/UTC',
    description: 'Weekly maintenance tasks on Sunday midnight UTC',
    category: 'maintenance',
    priority: 6,
    scripts: [
      {
        name: 'synchoBudgetCoproprietaire',
        modulePath: '../cron/synchoBudgetCoproprietaire',
        enabled: true,
        order: 1
      },
      {
        name: 'synchroCopro',
        modulePath: '../cron/synchroCopro',
        enabled: true,
        order: 2
      },
      {
        name: 'synchroUsers',
        modulePath: '../cron/synchroUsers',
        enabled: true,
        order: 3
      }
    ],
    timeout: 7200000, // 2 hours
    maxRetries: 1,
    notifications: {
      onError: true,
      onSuccess: true
    }
  },
  {
    name: 'weekly-saturday',
    schedule: '0 0 * * 6',
    enabled: true,
    timezone: 'Etc/UTC',
    description: 'Weekly tasks on Saturday midnight UTC',
    category: 'maintenance',
    priority: 5,
    scripts: [
      {
        name: 'contratAssurance',
        modulePath: './synchroContratAssurance',
        enabled: true,
        order: 1
      },
      {
        name: 'synchroTravaux',
        modulePath: '../cron/synchroTravaux',
        enabled: true,
        order: 2
      }
    ],
    timeout: 3600000, // 1 hour
    maxRetries: 2,
    notifications: {
      onError: true,
      onSuccess: false
    }
  },
  {
    name: 'evening-7pm',
    schedule: '0 19 * * *',
    enabled: true,
    timezone: 'Etc/UTC',
    description: 'Evening OCR processing at 7 PM UTC',
    category: 'sync',
    priority: 4,
    scripts: [
      {
        name: 'synchroFactureOCRMonday',
        modulePath: '../cron/synchroFactureOCRMonday',
        enabled: true,
        order: 1
      }
    ],
    timeout: 1800000, // 30 minutes
    maxRetries: 3,
    notifications: {
      onError: true,
      onSuccess: false
    }
  },
  {
    name: 'every-5-minutes',
    schedule: '*/5 * * * *',
    enabled: true,
    timezone: 'Etc/UTC',
    description: 'Database-driven scripts execution every 5 minutes',
    category: 'monitoring',
    priority: 10,
    scripts: [], // This uses the dynamic scriptsList from ScriptService
    timeout: 300000, // 5 minutes
    maxRetries: 1,
    notifications: {
      onError: false,
      onSuccess: false
    },
    metadata: {
      type: 'dynamic',
      source: 'scriptService'
    }
  }
];

/**
 * Seed the database with default cron configurations
 */
async function seedCronConfigs() {
  try {
    console.log('Starting cron configuration seeding...');
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const config of defaultCronConfigs) {
      try {
        // Check if configuration already exists
        const existing = await CronConfigService.getConfigByName(config.name);
        
        if (existing) {
          console.log(`Cron config '${config.name}' already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create new configuration
        await CronConfigService.createConfig(config);
        console.log(`Created cron config: ${config.name}`);
        createdCount++;

      } catch (error) {
        console.error(`Failed to create cron config '${config.name}':`, error.message);
        errorCount++;
      }
    }

    console.log(`\nCron configuration seeding completed:`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Skipped (already exists): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${defaultCronConfigs.length}`);

    return {
      created: createdCount,
      skipped: skippedCount,
      errors: errorCount,
      total: defaultCronConfigs.length
    };

  } catch (error) {
    console.error('Failed to seed cron configurations:', error);
    throw error;
  }
}

/**
 * Update existing configurations with new fields (for migrations)
 */
async function updateCronConfigs() {
  try {
    console.log('Updating existing cron configurations...');
    
    const existingConfigs = await CronConfigService.getAllConfigs();
    let updatedCount = 0;

    for (const existing of existingConfigs) {
      try {
        const defaultConfig = defaultCronConfigs.find(dc => dc.name === existing.name);
        
        if (defaultConfig) {
          // Update with new fields from default config
          const updates = {};
          
          if (!existing.category && defaultConfig.category) {
            updates.category = defaultConfig.category;
          }
          
          if (!existing.priority && defaultConfig.priority) {
            updates.priority = defaultConfig.priority;
          }
          
          if (!existing.timeout && defaultConfig.timeout) {
            updates.timeout = defaultConfig.timeout;
          }
          
          if (!existing.maxRetries && defaultConfig.maxRetries) {
            updates.maxRetries = defaultConfig.maxRetries;
          }
          
          if (!existing.notifications && defaultConfig.notifications) {
            updates.notifications = defaultConfig.notifications;
          }

          if (Object.keys(updates).length > 0) {
            await CronConfigService.updateConfig(existing.name, updates);
            console.log(`Updated cron config: ${existing.name}`);
            updatedCount++;
          }
        }

      } catch (error) {
        console.error(`Failed to update cron config '${existing.name}':`, error.message);
      }
    }

    console.log(`Updated ${updatedCount} existing cron configurations`);
    return updatedCount;

  } catch (error) {
    console.error('Failed to update cron configurations:', error);
    throw error;
  }
}

/**
 * Remove outdated or invalid configurations
 */
async function cleanupCronConfigs() {
  try {
    console.log('Cleaning up cron configurations...');
    
    const allConfigs = await CronConfigService.getAllConfigs();
    const validNames = defaultCronConfigs.map(dc => dc.name);
    
    let removedCount = 0;

    for (const config of allConfigs) {
      // Only remove configs that don't match default names and have specific metadata
      if (!validNames.includes(config.name) && 
          config.metadata && 
          config.metadata.get('auto_generated') === true) {
        
        try {
          await CronConfigService.deleteConfig(config.name);
          console.log(`Removed outdated cron config: ${config.name}`);
          removedCount++;
        } catch (error) {
          console.error(`Failed to remove cron config '${config.name}':`, error.message);
        }
      }
    }

    console.log(`Removed ${removedCount} outdated cron configurations`);
    return removedCount;

  } catch (error) {
    console.error('Failed to cleanup cron configurations:', error);
    throw error;
  }
}

/**
 * Complete seeding process with seed, update, and cleanup
 */
async function fullSeed() {
  try {
    console.log('='.repeat(50));
    console.log('Starting full cron configuration seeding process...');
    console.log('='.repeat(50));

    const seedResult = await seedCronConfigs();
    const updateCount = await updateCronConfigs();
    const cleanupCount = await cleanupCronConfigs();

    console.log('\n' + '='.repeat(50));
    console.log('Full cron configuration seeding completed:');
    console.log(`- New configurations created: ${seedResult.created}`);
    console.log(`- Existing configurations updated: ${updateCount}`);
    console.log(`- Outdated configurations removed: ${cleanupCount}`);
    console.log(`- Configurations skipped: ${seedResult.skipped}`);
    console.log(`- Errors encountered: ${seedResult.errors}`);
    console.log('='.repeat(50));

    return {
      ...seedResult,
      updated: updateCount,
      removed: cleanupCount
    };

  } catch (error) {
    console.error('Full seeding process failed:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  seedCronConfigs,
  updateCronConfigs,
  cleanupCronConfigs,
  fullSeed,
  defaultCronConfigs
};

// Allow running as standalone script
if (require.main === module) {
  fullSeed()
    .then((result) => {
      console.log('Seeding completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}