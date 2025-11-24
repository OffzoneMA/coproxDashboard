# Migration to Database-Only Cron System

## Overview

The cron system has been updated to be **100% database-driven**. All hardcoded cron schedules have been removed. The database (MongoDB CronConfig collection) is now the single source of truth.

## What Changed

### Before
- Hardcoded cron schedules as fallback if database unavailable
- System would start with default schedules even without database
- Mixed source of truth (code + database)

### After
- ✅ **100% database-driven** - no hardcoded schedules
- ✅ Database is the single source of truth
- ✅ Clear error messages if database is empty
- ✅ System won't start jobs without database configuration

## Migration Steps

### Step 1: Check Current Database

```bash
# Check if you have cron configurations
curl http://localhost:8081/cron-config/

# Check if any are enabled
curl http://localhost:8081/cron-config/enabled
```

### Step 2: Seed Database (If Empty)

```bash
# Initialize database with default cron configurations
curl -X POST http://localhost:8081/cron-config/seed
```

This will create the following default configurations:

- **morning-sync-3am** - Daily at 3 AM
  - synchroRapelles
  - synchroFacture
  - zendeskTicket
  - recoverAllSuspendedTickets

- **early-morning-5am** - Daily at 5 AM
  - synchroComptaList401
  - synchroComptaList472
  - synchroComptaRapprochementBancaire

- **midnight-1am** - Daily at 1 AM
  - synchroMandats
  - synchroContratEntretien
  - contratAssurance
  - synchroSuiviVieCopro

- **weekly-sunday** - Weekly on Sunday
  - synchoBudgetCoproprietaire
  - synchroCopro
  - synchroUsers
  - synchroPrestataire

- **weekly-saturday** - Weekly on Saturday
  - contratAssurance
  - synchroTravaux

- **evening-7pm** - Daily at 7 PM
  - synchroFactureOCRMonday

- **every-5-minutes** - Every 5 minutes
  - Manual trigger checker (status=1 scripts)

- **daily-cleanup-2am** - Daily at 2 AM
  - cleanupStaleScripts

### Step 3: Reload Cron System

```bash
# Restart cron jobs to pick up database configurations
curl -X POST http://localhost:8081/cron-config/reload
```

### Step 4: Verify Setup

```bash
# Check active cron jobs
curl http://localhost:8081/cron-config/enabled

# Verify in server logs
# You should see:
# ✓ Loaded X enabled cron configurations from database
# ✓ Cron system initialized with X jobs
```

## Troubleshooting

### Error: "No enabled cron configurations found in database"

**Cause:** Database is empty or no configurations are enabled

**Solution:**
```bash
curl -X POST http://localhost:8081/cron-config/seed
curl -X POST http://localhost:8081/cron-config/reload
```

### Error: "Failed to load cron configurations from database"

**Cause:** Database connection issue

**Solution:**
1. Check MongoDB connection string
2. Verify database is running
3. Check network connectivity
4. Review server logs for detailed error

### System Starts But No Jobs Running

**Cause:** All cron configurations are disabled

**Solution:**
```bash
# Enable a specific cron config
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am/enabled \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Reload
curl -X POST http://localhost:8081/cron-config/reload
```

## Server Log Messages

### Successful Startup
```
========================================
Initializing DATABASE-DRIVEN cron system
========================================
✓ Loaded 8 enabled cron configurations from database
Scheduling cron job: morning-sync-3am with schedule: 0 3 * * *
Started cron job: morning-sync-3am
...
========================================
✓ Cron system initialized with 8 jobs
========================================
```

### Warning: Empty Database
```
========================================
Initializing DATABASE-DRIVEN cron system
========================================
⚠️  No enabled cron configurations found in database!
⚠️  Run POST /cron-config/seed to initialize default configurations
⚠️  ========================================
⚠️  NO CRON JOBS CONFIGURED IN DATABASE!
⚠️  ========================================
⚠️  To initialize: POST /cron-config/seed
⚠️  Cron system running but no jobs scheduled
```

### Error: Database Connection Failed
```
========================================
Initializing DATABASE-DRIVEN cron system
========================================
✗ Failed to load cron configurations from database: [error message]
✗ Cron system will not start. Please check database connection and run seed endpoint.
✗ Failed to initialize cron job system: [error]
✗ Check database connection and run: POST /cron-config/seed
```

## Managing Cron Configurations

### View All Configurations
```bash
curl http://localhost:8081/cron-config/
```

### Create New Configuration
```bash
curl -X POST http://localhost:8081/cron-config/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-job",
    "schedule": "0 12 * * *",
    "enabled": true,
    "description": "Custom job at noon",
    "scripts": [
      {
        "name": "myScript",
        "modulePath": "../cron/myScript",
        "enabled": true
      }
    ]
  }'
```

### Update Existing Configuration
```bash
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "0 4 * * *",
    "description": "Updated to 4 AM"
  }'
```

### Enable/Disable Configuration
```bash
# Disable
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am/enabled \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Enable
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am/enabled \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### Delete Configuration
```bash
curl -X DELETE http://localhost:8081/cron-config/morning-sync-3am
```

### Always Reload After Changes
```bash
curl -X POST http://localhost:8081/cron-config/reload
```

## Benefits of Database-Only Approach

✅ **Single Source of Truth** - All schedules in one place

✅ **Dynamic Management** - Change schedules without code changes

✅ **Environment-Specific** - Different schedules per environment

✅ **No Hidden Defaults** - What's in database is what runs

✅ **Clear Errors** - Explicit messages when configuration missing

✅ **Better Control** - Enable/disable jobs without code deployment

## Important Notes

⚠️  **First-time Setup Required** - Must run `/cron-config/seed` endpoint

⚠️  **Database Required** - System won't start without database connection

⚠️  **Reload After Changes** - Always run `/cron-config/reload` after modifications

⚠️  **Auto-Reload** - System automatically reloads from database every hour

⚠️  **Manual Execution** - Still requires a cron config to check for status=1 scripts

## Backward Compatibility

✅ **Existing Cron Configs** - Continue to work as before

✅ **Manual Execution** - Still works via status flags

✅ **API Endpoints** - No changes to API

✅ **Script Files** - No changes needed to individual scripts

❌ **Hardcoded Fallback** - Removed (was legacy code)

## Testing

### Test Database Connection
```bash
curl http://localhost:8081/cron-config/
```

### Test Seed Endpoint
```bash
curl -X POST http://localhost:8081/cron-config/seed
```

### Test Reload
```bash
curl -X POST http://localhost:8081/cron-config/reload
```

### Verify Logs
Check server logs for:
- `✓ Loaded X enabled cron configurations from database`
- `✓ Cron system initialized with X jobs`

## Rollback (If Needed)

If you need to rollback to hardcoded schedules:

1. Restore previous version of `cronStart.js`
2. Restart server
3. System will use hardcoded schedules as fallback

However, **this is not recommended** - better to fix database issues.

## Support

If you encounter issues:

1. Check database connection
2. Run seed endpoint
3. Check server logs
4. Verify cron configurations in database
5. Test with simple cron first

For detailed documentation, see:
- `CRON_CONFIGURATION.md`
- `CRON_VS_MANUAL_EXECUTION.md`
- `CRON_SYSTEM_VISUAL_GUIDE.md`
