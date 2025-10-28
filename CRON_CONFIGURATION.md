# Cron Configuration System

This document explains how to use the new MongoDB-based cron configuration system in CoproxDashboard.

## Overview

The cron configuration system allows you to manage scheduled tasks through MongoDB instead of hardcoded schedules. This provides:

- **Dynamic Configuration**: Change cron schedules without code changes
- **Real-time Management**: Enable/disable cron jobs through API
- **Monitoring**: Track execution statistics and error rates
- **Flexibility**: Add, remove, and modify cron jobs on the fly

## Quick Start

### 1. Seed Default Configurations

```bash
# Initialize the database with existing cron schedules
curl -X POST http://localhost:8081/cron-config/seed
```

### 2. View All Configurations

```bash
# Get all cron configurations
curl http://localhost:8081/cron-config/

# Get only enabled configurations
curl http://localhost:8081/cron-config/enabled
```

### 3. Reload Cron Jobs

```bash
# Reload cron jobs to apply configuration changes
curl -X POST http://localhost:8081/cron-config/reload
```

## API Endpoints

### Basic Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cron-config/` | Get all configurations |
| GET | `/cron-config/enabled` | Get enabled configurations |
| GET | `/cron-config/:name` | Get specific configuration |
| POST | `/cron-config/` | Create new configuration |
| PUT | `/cron-config/:name` | Update configuration |
| DELETE | `/cron-config/:name` | Delete configuration |

### Management Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/cron-config/:name/enabled` | Enable/disable configuration |
| POST | `/cron-config/reload` | Reload all cron jobs |
| POST | `/cron-config/seed` | Seed default configurations |
| GET | `/cron-config/stats` | Get system statistics |

### Script Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/cron-config/:name/scripts` | Add script to configuration |
| PUT | `/cron-config/:name/scripts/:scriptName` | Update script |
| DELETE | `/cron-config/:name/scripts/:scriptName` | Remove script |

## Configuration Structure

```json
{
  "name": "morning-sync-3am",
  "schedule": "0 3 * * *",
  "enabled": true,
  "timezone": "Etc/UTC",
  "description": "Morning synchronization tasks",
  "category": "sync",
  "priority": 8,
  "scripts": [
    {
      "name": "synchroRapelles",
      "modulePath": "../cron/synchroRapelles",
      "enabled": true,
      "order": 1
    }
  ],
  "timeout": 3600000,
  "maxRetries": 2,
  "notifications": {
    "onError": true,
    "onSuccess": false
  }
}
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Unique identifier for the cron job |
| `schedule` | String | Cron expression (e.g., "0 3 * * *") |
| `enabled` | Boolean | Whether the cron job is active |
| `timezone` | String | Timezone for schedule (default: "Etc/UTC") |
| `description` | String | Human-readable description |
| `category` | String | Category: sync, maintenance, monitoring, backup, other |
| `priority` | Number | Priority level (1-10, higher = more important) |
| `scripts` | Array | Scripts to execute |
| `timeout` | Number | Maximum execution time in milliseconds |
| `maxRetries` | Number | Maximum retry attempts on failure |
| `notifications` | Object | Notification settings |

## Examples

### Create a New Cron Job

```bash
curl -X POST http://localhost:8081/cron-config/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "daily-cleanup",
    "schedule": "0 2 * * *",
    "description": "Daily cleanup tasks",
    "category": "maintenance",
    "scripts": [
      {
        "name": "cleanupFiles",
        "modulePath": "../cron/cleanupFiles",
        "enabled": true,
        "order": 1
      }
    ]
  }'
```

### Update a Cron Job Schedule

```bash
curl -X PUT http://localhost:8081/cron-config/daily-cleanup \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "0 1 * * *",
    "description": "Updated daily cleanup - runs at 1 AM"
  }'
```

### Disable a Cron Job

```bash
curl -X PUT http://localhost:8081/cron-config/daily-cleanup/enabled \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### Add a Script to Existing Cron Job

```bash
curl -X POST http://localhost:8081/cron-config/daily-cleanup/scripts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "archiveOldFiles",
    "modulePath": "../cron/archiveOldFiles",
    "enabled": true,
    "order": 2
  }'
```

## Monitoring

### Get Statistics

```bash
curl http://localhost:8081/cron-config/stats
```

Returns:
```json
{
  "total": 7,
  "enabled": 6,
  "disabled": 1,
  "categories": {
    "sync": 4,
    "maintenance": 2,
    "monitoring": 1
  },
  "totalRuns": 1250,
  "totalErrors": 15,
  "errorRate": "1.20%"
}
```

### Get High Error Rate Configurations

```bash
curl http://localhost:8081/cron-config/high-error-rate?threshold=0.05
```

## Migration from Hardcoded Schedules

The system automatically falls back to hardcoded schedules if the database is unavailable. To migrate:

1. **Seed the database**: `POST /cron-config/seed`
2. **Verify configurations**: `GET /cron-config/`
3. **Reload cron jobs**: `POST /cron-config/reload`
4. **Monitor execution**: Check logs and stats

## Best Practices

### 1. Schedule Planning
- Use UTC timezone for consistency
- Avoid overlapping resource-intensive jobs
- Consider system load patterns

### 2. Error Handling
- Set appropriate timeout values
- Configure retry policies
- Enable error notifications for critical jobs

### 3. Monitoring
- Regularly check error rates
- Monitor execution times
- Review and clean up unused configurations

### 4. Script Organization
- Use clear, descriptive names
- Organize scripts by category
- Maintain proper execution order

## Troubleshooting

### Common Issues

1. **Cron jobs not running**
   - Check if configurations are enabled
   - Verify cron expressions are valid
   - Reload cron jobs: `POST /cron-config/reload`

2. **Database connection errors**
   - System falls back to hardcoded schedules
   - Check MongoDB connectivity
   - Verify configuration collection exists

3. **Script execution failures**
   - Check script paths are correct
   - Verify required modules exist
   - Review execution logs

### Validation

```bash
# Validate cron expression
curl -X POST http://localhost:8081/cron-config/validate-expression \
  -H "Content-Type: application/json" \
  -d '{"expression": "0 */2 * * *"}'
```

### Reset Error Counts

```bash
curl -X PUT http://localhost:8081/cron-config/morning-sync-3am/reset-errors
```

## Integration with Existing Scripts

The system maintains backward compatibility with existing cron scripts. The 5-minute cron job automatically executes database-managed scripts from the `ScriptState` collection.

Existing scripts continue to work without modification, but you can now:
- Change their execution schedule
- Enable/disable them dynamically
- Monitor their performance
- Group them into logical cron jobs

## Security Considerations

- API endpoints are unprotected in this implementation
- Consider adding authentication/authorization
- Validate cron expressions to prevent malicious input
- Limit configuration modification privileges
- Monitor for unusual configuration changes

## Support

For issues or questions:
1. Check the server logs
2. Verify database connectivity
3. Test API endpoints manually
4. Review cron expression syntax
5. Check script module paths