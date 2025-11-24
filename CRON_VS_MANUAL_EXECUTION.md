# Cron vs Manual Execution System

## Overview

The CoproxDashboard has **TWO INDEPENDENT** script execution systems that work in parallel:

1. **Automated Cron Execution** - Scripts run on a schedule (100% database-driven)
2. **Manual Script Execution** - Scripts triggered by user button click

⚠️  **IMPORTANT:** All cron schedules are stored in MongoDB CronConfig collection. No hardcoded schedules exist. You must seed the database before cron jobs will run.

---

## 🤖 System 1: Automated Cron Execution

### Purpose
Run scripts automatically on a scheduled basis without any user interaction.

### How It Works
- Scripts are configured with cron expressions (e.g., `0 3 * * *` = daily at 3am)
- The cron scheduler runs them at the specified time
- **Does NOT check or update status flags**
- Execution happens regardless of the script's status field

### Configuration
**100% managed via MongoDB `CronConfig` collection - NO hardcoded schedules:**

```bash
# FIRST TIME: Seed the database with default configurations
curl -X POST http://localhost:8081/cron-config/seed

# View cron configurations
curl http://localhost:8081/cron-config/

# Example cron jobs (after seeding):
- morning-sync-3am: Runs daily at 3 AM
- weekly-sunday: Runs every Sunday at midnight
- early-morning-5am: Runs daily at 5 AM
- every-5-minutes: Checks for manual triggers

# After any changes, reload the cron system
curl -X POST http://localhost:8081/cron-config/reload
```

### Example Cron Jobs
```javascript
{
  name: 'morning-sync-3am',
  schedule: '0 3 * * *',
  description: 'Morning synchronization tasks at 3 AM',
  scripts: [
    { name: 'synchroRapelles', enabled: true },
    { name: 'synchroFacture', enabled: true },
    { name: 'zendeskTicket', enabled: true }
  ]
}
```

### Code Flow
```
Cron Timer Fires
    ↓
executeCronScripts()
    ↓
executeScheduledScript()
    ↓
script.start()
    ↓
Log execution history
```

### Key Functions
- `executeScheduledScript(name, script)` - Runs script on schedule
- Logging prefix: `[CRON]` or `[SCHEDULED]`

---

## 👆 System 2: Manual Script Execution

### Purpose
Allow users to trigger scripts immediately via the dashboard UI.

### How It Works
1. User clicks "Lancer Manuellement" button in UI
2. Frontend calls `POST /script/update-status` with `status: 1`
3. Database updates script status to `1` (waiting to start)
4. The `every-5-minutes` cron checks for scripts with `status === 1`
5. If found, executes via `executeManualScript()`
6. Status updates: `1 → 2 → 0/-1` (waiting → running → success/error)

### Status Lifecycle
| Status | Meaning | When |
|--------|---------|------|
| 0 | Success | Script completed successfully |
| 1 | Waiting to start | User clicked "Run", waiting for next 5-min check |
| 2 | In progress | Script is currently running |
| -1 | Error/Failed | Script encountered an error |

### Special Cron: `every-5-minutes`
```javascript
{
  name: 'every-5-minutes',
  schedule: '*/5 * * * *',
  description: 'Check for manually triggered scripts',
  scripts: [] // Uses scriptsList from database
}
```

This cron job:
- Runs every 5 minutes
- Scans ALL scripts in the database
- Executes only those with `status === 1`
- Updates their status through the lifecycle

### Code Flow
```
User Clicks Button
    ↓
POST /script/update-status { status: 1 }
    ↓
Database: script.status = 1
    ↓
(Wait up to 5 minutes)
    ↓
every-5-minutes cron fires
    ↓
executeManualScript() checks status
    ↓
If status === 1:
    Update status to 2
    ↓
    script.start()
    ↓
    Update status to 0 or -1
```

### Key Functions
- `executeManualScript(name, script)` - Checks status before running
- Logging prefix: `[MANUAL]`

---

## 🔑 Key Differences

| Aspect | Cron Execution | Manual Execution |
|--------|---------------|------------------|
| **Trigger** | Time-based (cron schedule) | User button click |
| **Status Check** | ❌ No | ✅ Yes (must be status=1) |
| **Status Update** | ❌ No | ✅ Yes (1→2→0/-1) |
| **Frequency** | As configured (daily, weekly, etc.) | On-demand |
| **Independence** | Fully independent | Depends on 5-min polling cron |
| **Use Case** | Regular maintenance tasks | Ad-hoc testing/fixes |
| **Logging Prefix** | `[CRON]` / `[SCHEDULED]` | `[MANUAL]` |

---

## 📋 UI Elements

### Planification Cron Column
- Shows the cron schedule (e.g., "Quotidien à 3h00")
- Edit icon to configure the schedule
- Displays run count and error count
- Shows last execution time

### Exécution Manuelle Column
- "Lancer Manuellement" button
- Triggers immediate execution
- Disabled when script is already running (status=2)
- Independent of cron schedule

---

## 🎯 Common Scenarios

### Scenario 1: Script Runs Only on Schedule
```javascript
// Cron: Daily at 3am
// Manual: Never triggered
// Result: Runs automatically at 3am every day
```

### Scenario 2: Script Triggered Manually Only
```javascript
// Cron: Not configured or disabled
// Manual: User clicks button
// Result: Runs within 5 minutes of button click
```

### Scenario 3: Both Systems Active
```javascript
// Cron: Daily at 3am
// Manual: User clicks button at 2pm
// Result: 
//   - Runs automatically at 3am (cron)
//   - ALSO runs at ~2pm when user clicks (manual)
//   - Two separate executions, independent of each other
```

### Scenario 4: Manual Click During Cron Run
```javascript
// Cron: Running at 3am
// Manual: User clicks button at 3:05am
// Result:
//   - Cron execution continues (status not checked)
//   - Manual trigger sets status to 1
//   - At 3:10am (next 5-min check), manual execution starts
//   - Two instances may run in parallel
```

---

## 🛠️ Configuration Examples

### Configure Cron Schedule
```bash
# Update script's cron schedule
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "0 4 * * *",
    "enabled": true,
    "description": "Updated to 4 AM"
  }'

# Reload cron jobs to apply changes
curl -X POST http://localhost:8081/cron-config/reload
```

### Trigger Manual Execution
```bash
# Set script to "waiting" status
curl -X POST http://localhost:8081/script/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "scriptName": "synchroFacture",
    "status": 1
  }'

# Script will run within 5 minutes
```

### Check Script Status
```bash
# Get all scripts with their current status
curl http://localhost:8081/script/
```

---

## 🔍 Debugging

### Check Cron Logs
Look for these prefixes in server logs:
- `[CRON]` - Cron system messages
- `[SCHEDULED]` - Scheduled execution of scripts
- `[MANUAL]` - Manual execution of scripts
- `[MANUAL TRIGGER CHECK]` - The 5-minute check for manual triggers

### Example Log Output
```
[SCHEDULED] Executing script: synchroFacture
[CRON] ✓ Script synchroFacture completed successfully

[MANUAL TRIGGER CHECK] Scanning for user-triggered scripts (status=1)
[MANUAL] Starting user-triggered script: zendeskTicket
[MANUAL] ✓ Script zendeskTicket completed successfully
```

### Common Issues

#### Manual Script Doesn't Run
- **Check:** Is the script status set to 1?
- **Check:** Wait up to 5 minutes for next poll
- **Check:** Look for `[MANUAL TRIGGER CHECK]` logs

#### Cron Script Doesn't Run
- **Check:** Is the cron configuration enabled?
- **Check:** Is the schedule correct?
- **Check:** Did you reload cron jobs after changes?

#### Script Runs Twice
- This is normal if both systems are active
- Cron runs on schedule
- Manual runs when triggered
- They are independent

---

## 📚 Related Files

### Backend
- `server/src/cron/cronStart.js` - Main cron orchestrator
- `server/src/services/scriptService.js` - Script status management
- `server/src/services/cronConfigService.js` - Cron configuration
- `server/src/controllers/scriptController.js` - Script API endpoints
- `server/src/routes/scriptRoutes.js` - Script routes

### Frontend
- `front/src/containers/script.js` - Script management UI

### Documentation
- `CRON_CONFIGURATION.md` - Cron system configuration
- `SCRIPT_CLEANUP_GUIDE.md` - Automatic cleanup of stale scripts

---

## 🎓 Best Practices

1. **Use Cron for Regular Tasks**
   - Daily syncs, weekly reports, cleanup tasks
   - Predictable, reliable execution

2. **Use Manual for Ad-hoc Tasks**
   - Testing new scripts
   - Emergency data fixes
   - On-demand synchronization

3. **Don't Mix Unnecessarily**
   - If a script needs both, that's fine
   - But consider if it really needs both
   - Document why both are needed

4. **Monitor Status**
   - Check logs regularly
   - Watch for status=2 scripts stuck > 3 days
   - Use the automatic cleanup feature

5. **Clear Naming**
   - Name cron jobs descriptively
   - Include time in cron job name
   - Document manual-only scripts

---

## Summary

✅ **Two independent systems**
✅ **Clear separation of concerns**
✅ **Cron = automatic, scheduled**
✅ **Manual = user-triggered, status-based**
✅ **Both can coexist for the same script**
✅ **Each has distinct logging and tracking**
