# Quick Start: Database-Driven Cron System

## ⚡ First Time Setup (Required)

The cron system is now **100% database-driven**. Before any cron jobs will run, you MUST seed the database:

```bash
# Step 1: Initialize database with default cron configurations
curl -X POST http://localhost:8081/cron-config/seed

# Step 2: Reload the cron system
curl -X POST http://localhost:8081/cron-config/reload

# Step 3: Verify it worked
curl http://localhost:8081/cron-config/enabled
```

**Expected Response:** You should see 8 cron configurations including:
- morning-sync-3am
- early-morning-5am
- midnight-1am
- weekly-sunday
- weekly-saturday
- evening-7pm
- every-5-minutes (for manual triggers)
- daily-cleanup-2am

## ✅ What You Get

After seeding, these cron jobs will run automatically:

| Job Name | Schedule | Purpose |
|----------|----------|---------|
| morning-sync-3am | Daily at 3 AM | Main sync (rapelles, factures, zendesk) |
| early-morning-5am | Daily at 5 AM | Accounting sync (compta lists) |
| midnight-1am | Daily at 1 AM | Mandats, contracts, vie copro |
| weekly-sunday | Weekly Sunday 0:00 | Budget, copro, users, prestataire |
| weekly-saturday | Weekly Saturday 0:00 | Contracts, travaux |
| evening-7pm | Daily at 7 PM | OCR processing |
| every-5-minutes | Every 5 minutes | Manual trigger checker |
| daily-cleanup-2am | Daily at 2 AM | Cleanup stale scripts |

## 🔧 Common Operations

### View All Cron Jobs
```bash
curl http://localhost:8081/cron-config/
```

### Enable/Disable a Job
```bash
# Disable
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am/enabled \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Enable
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am/enabled \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Always reload after changes
curl -X POST http://localhost:8081/cron-config/reload
```

### Change Schedule
```bash
# Change morning sync to 4 AM instead of 3 AM
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "0 4 * * *",
    "description": "Morning synchronization tasks at 4 AM"
  }'

# Reload
curl -X POST http://localhost:8081/cron-config/reload
```

### Add New Cron Job
```bash
curl -X POST http://localhost:8081/cron-config/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "afternoon-sync",
    "schedule": "0 14 * * *",
    "enabled": true,
    "description": "Afternoon sync at 2 PM",
    "scripts": [
      {
        "name": "myScript",
        "modulePath": "../cron/myScript",
        "enabled": true
      }
    ]
  }'

# Reload
curl -X POST http://localhost:8081/cron-config/reload
```

## 🚨 Troubleshooting

### No Cron Jobs Running

**Check if database is seeded:**
```bash
curl http://localhost:8081/cron-config/enabled
```

If empty, run:
```bash
curl -X POST http://localhost:8081/cron-config/seed
curl -X POST http://localhost:8081/cron-config/reload
```

### Server Logs Show Warning

If you see:
```
⚠️  NO CRON JOBS CONFIGURED IN DATABASE!
⚠️  To initialize: POST /cron-config/seed
```

**Solution:** Run the seed endpoint (see above)

### Database Connection Error

If you see:
```
✗ Failed to load cron configurations from database
```

**Check:**
1. MongoDB is running
2. Connection string is correct
3. Database has network access
4. User has proper permissions

## 📖 Full Documentation

- **`DATABASE_CRON_MIGRATION.md`** - Complete migration guide
- **`CRON_VS_MANUAL_EXECUTION.md`** - How the two systems work
- **`CRON_CONFIGURATION.md`** - Detailed API documentation
- **`CRON_SYSTEM_VISUAL_GUIDE.md`** - Visual diagrams

## 💡 Key Points

✅ **Database is the source of truth** - No hardcoded schedules

✅ **Must seed first time** - Run `/cron-config/seed` once

✅ **Reload after changes** - Run `/cron-config/reload` after any modification

✅ **Auto-reload every hour** - System checks database hourly for changes

✅ **Manual execution still works** - Requires `every-5-minutes` cron to be enabled

## 🎯 Quick Reference: Cron Expressions

| Expression | Meaning |
|------------|---------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 3 * * *` | Daily at 3 AM |
| `0 0 * * 0` | Weekly on Sunday at midnight |
| `0 0 * * 1-5` | Weekdays at midnight |
| `0 9-17 * * *` | Every hour from 9 AM to 5 PM |

Format: `minute hour day month day-of-week`

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/cron-config/seed` | Initialize database with defaults |
| POST | `/cron-config/reload` | Reload cron system from database |
| GET | `/cron-config/` | List all configurations |
| GET | `/cron-config/enabled` | List enabled configurations |
| POST | `/cron-config/` | Create new configuration |
| PUT | `/cron-config/:name` | Update configuration |
| DELETE | `/cron-config/:name` | Delete configuration |
| PUT | `/cron-config/:name/enabled` | Enable/disable configuration |

That's it! You're ready to go. 🚀
