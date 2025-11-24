# Automatic Script Cleanup

## Overview

This feature automatically marks scripts that have been stuck in "In Progress" (status: 2) for more than 3 days as "Failed" (status: -1). This prevents the dashboard from showing perpetually running scripts that have likely crashed or timed out.

## How It Works

### Automated Cleanup
A cron job runs **daily at 2:00 AM UTC** to check for and clean up stale scripts:

```json
{
  "name": "daily-cleanup-2am",
  "schedule": "0 2 * * *",
  "enabled": true,
  "description": "Daily cleanup of stale in-progress scripts at 2 AM UTC"
}
```

### Logic
1. Scans all script logs in the database
2. Finds logs with status `2` (In Progress)
3. Checks if the `startTime` is more than 3 days old
4. Updates those logs to status `-1` (Failed)
5. Sets `endTime` to current time
6. Adds message: "Script marked as failed - exceeded 3 day timeout"

## Manual Trigger

You can manually trigger the cleanup process via API:

```bash
POST /script/cleanup-stale
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogsUpdated": 5,
    "scriptsAffected": 3,
    "scriptNames": ["synchroPrestataire", "synchroFacture", "zendeskTicket"],
    "thresholdDate": "2025-11-20T10:30:00.000Z"
  }
}
```

## Status Codes

- **2**: In Progress (Script is currently running)
- **0**: Success (Script completed successfully)
- **-1**: Error/Failed (Script encountered an error or exceeded timeout)

## Setup Instructions

### 1. Seed the Cron Configuration

If you're setting up for the first time or updating configurations:

```bash
curl -X POST https://coprox-dashboard-back.vercel.app/cron-config/seed
```

This will create the `daily-cleanup-2am` cron job configuration.

### 2. Reload Cron Jobs

After seeding, reload the cron scheduler to activate:

```bash
curl -X POST https://coprox-dashboard-back.vercel.app/cron-config/reload
```

### 3. Verify Setup

Check that the cleanup job is configured:

```bash
curl https://coprox-dashboard-back.vercel.app/cron-config/daily-cleanup-2am
```

## Monitoring

### View Cleanup Logs

You can view the cleanup script's execution history:

```bash
GET /script/logs
```

Look for entries with `scriptName: "cleanupStaleScripts"`.

### Check Script Status

View all scripts and their current status:

```bash
GET /script/dashboard-view
```

## Configuration

The 3-day threshold is hardcoded but can be modified in:
- **File**: `server/src/services/scriptService.js`
- **Method**: `markStaleInProgressScriptsAsFailed()`
- **Line**: `threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);`

To change to 5 days, for example:
```javascript
threeDaysAgo.setDate(threeDaysAgo.getDate() - 5);
```

## Files Modified/Created

### New Files:
- `server/src/cron/cleanupStaleScripts.js` - Cron job wrapper

### Modified Files:
- `server/src/services/scriptService.js` - Added `markStaleInProgressScriptsAsFailed()` method
- `server/src/utils/cronSeeder.js` - Added `daily-cleanup-2am` cron configuration
- `server/src/routes/scriptRoutes.js` - Added `/cleanup-stale` endpoint
- `server/src/controllers/scriptController.js` - Added `cleanupStaleScripts()` controller

## Benefits

1. **Clean Dashboard**: Prevents showing perpetually running scripts
2. **Accurate Reporting**: Provides accurate status for monitoring
3. **Automatic Recovery**: No manual intervention needed
4. **Audit Trail**: All cleanup actions are logged
5. **Flexible**: Can be triggered manually or automatically

## Example Use Cases

### Case 1: Deployment Interruption
A script starts running but the server restarts mid-execution. After 3 days, it's automatically marked as failed.

### Case 2: Network Timeout
A script hangs due to external API timeout and never completes. The cleanup job marks it as failed after 3 days.

### Case 3: Manual Testing
During testing, you manually trigger cleanup to clear out old test runs:
```bash
curl -X POST https://coprox-dashboard-back.vercel.app/script/cleanup-stale
```
