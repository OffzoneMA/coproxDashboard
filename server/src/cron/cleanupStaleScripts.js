// cleanupStaleScripts.js
// This script marks scripts that have been "In Progress" for more than 3 days as "Failed"

const scriptService = require('../services/scriptService');
const logs = require('../services/logs');

const cleanupStaleScripts = {
    start: async () => {
        logs.logExecution("cleanupStaleScripts");
        console.log('===== Starting Stale Scripts Cleanup =====');
        
        try {
            const result = await scriptService.markStaleInProgressScriptsAsFailed();
            
            console.log(`Cleanup completed successfully:`);
            console.log(`  - Total logs updated: ${result.totalLogsUpdated}`);
            console.log(`  - Scripts affected: ${result.scriptsAffected}`);
            console.log(`  - Threshold date: ${result.thresholdDate.toISOString()}`);
            
            if (result.scriptNames.length > 0) {
                console.log(`  - Affected scripts: ${result.scriptNames.join(', ')}`);
            }
            
            console.log('===== Stale Scripts Cleanup Completed =====');
        } catch (error) {
            console.error("Error during stale scripts cleanup:", error);
            throw error;
        }
    }
};

module.exports = cleanupStaleScripts;
