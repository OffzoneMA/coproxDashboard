# Vercel Deployment Configuration

## ⚠️ IMPORTANT: Vercel is for API Only, NOT for Cron Execution

### What Vercel Does
✅ Serves API endpoints for:
- Cron configuration (`/cron-config/*`)
- Script management (`/script/*`)
- Manual script triggering (`/script/update-status`)
- Monitoring and stats
- All other API routes

### What Vercel Does NOT Do
❌ **Does NOT execute cron jobs**
❌ **Does NOT run scheduled scripts**
❌ **Does NOT maintain persistent cron timers**

### Why?
Vercel is a **serverless platform**:
- Functions are ephemeral (start/stop on demand)
- No persistent processes
- No state between invocations
- Cannot maintain cron timers

### Cron Execution Environment

Cron jobs MUST run on a **dedicated server** with:
- ✅ Persistent process (always running)
- ✅ Node.js environment
- ✅ MongoDB connection
- ✅ Environment NOT detected as Vercel/serverless

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Serverless)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Endpoints Only                                │    │
│  │  - Configure cron schedules                        │    │
│  │  - Manage scripts                                  │    │
│  │  - Trigger manual execution (sets status=1)       │    │
│  │  - View stats and logs                            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    (API calls via HTTP)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Dedicated Server (Always Running)              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Cron System (cronStart.js)                       │    │
│  │  - Runs scheduled cron jobs                       │    │
│  │  - Checks for manual triggers every 5 min         │    │
│  │  - Executes scripts                               │    │
│  │  - Updates execution history                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Connects to same MongoDB for configs                      │
└─────────────────────────────────────────────────────────────┘
```

### Environment Detection

The code automatically detects serverless environments:

```javascript
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;

if (isVercel || isServerless) {
  // Cron execution DISABLED
  // Only API endpoints active
} else {
  // Cron execution ENABLED
  // scheduleCronJobs() called
}
```

### Deployment Options

#### Option 1: Separate Deployments (Recommended)
- **Vercel**: Deploy API server for web access
- **Dedicated Server**: Deploy same code for cron execution
- Same MongoDB database for both

#### Option 2: Single Dedicated Server
- Deploy on VPS/Cloud VM (DigitalOcean, AWS EC2, etc.)
- Runs both API and cron system
- Set `NODE_ENV=production` (not `VERCEL`)

#### Option 3: Hybrid
- **Vercel**: Public-facing API
- **Background Worker**: Heroku/Railway/Render for cron jobs
- Both connect to same database

### Vercel Configuration (Current)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

This configuration:
- ✅ Deploys Express API
- ✅ Serves all routes
- ❌ Does NOT run cron jobs (automatically disabled)

### Testing

#### Test API on Vercel
```bash
# These should work on Vercel
curl https://your-vercel-domain.vercel.app/cron-config/
curl https://your-vercel-domain.vercel.app/script/
curl -X POST https://your-vercel-domain.vercel.app/script/update-status \
  -d '{"scriptName": "test", "status": 1}'
```

#### Test Cron on Dedicated Server
```bash
# These should work on dedicated server
curl http://your-server:8081/cron-config/
# Check logs for cron execution messages
# Should see: [SCHEDULED] and [MANUAL] prefixes
```

### Logs

#### Vercel Logs (Expected)
```
========================================
⚠️  SERVERLESS ENVIRONMENT DETECTED
⚠️  Cron execution is DISABLED
⚠️  This instance only serves API endpoints
⚠️  Run cron jobs on a dedicated server
========================================
Server is running on port 8081
```

#### Dedicated Server Logs (Expected)
```
========================================
✓ Regular server environment detected
✓ Initializing cron system...
========================================
Initializing DATABASE-DRIVEN cron system
✓ Loaded 8 enabled cron configurations from database
✓ Cron system initialized with 8 jobs
========================================
Server is running on port 8081
```

### Common Issues

#### Issue: "Cron jobs not running"
**Check:** Are you on Vercel? Cron execution is disabled on Vercel.
**Solution:** Deploy on a dedicated server for cron execution.

#### Issue: "Manual triggers not working"
**Check:** Do you have a dedicated server running with the `every-5-minutes` cron?
**Solution:** 
1. Deploy on dedicated server
2. Ensure `every-5-minutes` cron config exists in database
3. Check server logs for `[MANUAL TRIGGER CHECK]` messages

#### Issue: "API works but no scheduled execution"
**Check:** Are you accessing the Vercel URL?
**Solution:** This is expected. Use dedicated server for cron execution.

### Environment Variables

Set these on your **dedicated server** (not Vercel):

```bash
# MongoDB connection
MONGODB_URI=mongodb://...

# Ensure these are NOT set (so cron runs)
# VERCEL=           # should not be set
# VERCEL_ENV=       # should not be set
# AWS_LAMBDA_FUNCTION_NAME=  # should not be set
```

On **Vercel**, environment variables can be anything, cron won't run regardless.

### Best Practice

1. **Vercel**: Use for public API access
   - Configure cron schedules via API
   - Trigger manual execution via API
   - View stats and logs

2. **Dedicated Server**: Use for actual execution
   - Runs cron jobs
   - Executes scripts
   - Processes manual triggers
   - Same database as Vercel

3. **Shared Database**: Both connect to same MongoDB
   - Vercel writes cron configs
   - Dedicated server reads configs and executes

### Summary

✅ **Vercel Role:** API endpoints for configuration and monitoring only

❌ **Vercel Does NOT:** Execute cron jobs or scheduled scripts

✅ **Dedicated Server Role:** Runs the actual cron system and executes scripts

🔄 **Shared:** Both use the same MongoDB database for coordination

This separation ensures reliable cron execution while maintaining easy API access through Vercel.
