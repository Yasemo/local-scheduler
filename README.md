# Local Scheduler Service

A standalone Deno service that mimics Google Cloud Scheduler behavior for local development.

## Overview

This service runs independently from your main JSphere application and sends HTTP POST requests to the `/api/scheduler/trigger` endpoint at regular intervals. This architecture:

- **Exactly mirrors production** where Google Cloud Scheduler sends requests to your deployed app
- **Runs independently** - no issues with hot-reloads or application lifecycle
- **Easy to manage** - simple start/stop without affecting your main app
- **Better for development** - clear separation of concerns

## Prerequisites

- Deno installed on your system
- Your main application running and accessible

## Setup

1. **Configure environment variables**

   Copy the example file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your values:
   ```bash
   SCHEDULER_INTERVAL=30000  # 30 seconds
   SCHEDULER_SECRET=your-secret-key-here  # Must match your app's secret
   APP_URL=http://localhost
   # APP_PORT=3000  # Uncomment if needed
   ```

2. **Ensure SCHEDULER_SECRET matches your main app**

   The `SCHEDULER_SECRET` in this file MUST match the `SCHEDULER_SECRET` environment variable in your main application's configuration.

## Usage

### Start the scheduler

From the `local-scheduler` directory:

```bash
deno run --allow-net --allow-env --allow-read --env-file=.env scheduler.ts
```

Or make it executable and set environment variables:

```bash
chmod +x scheduler.ts
# Load .env manually (Deno doesn't auto-load .env files in shebang mode)
export $(cat .env | xargs)
./scheduler.ts
```

### Using with Deno task (optional)

If you add this to your `deno.json`:

```json
{
  "tasks": {
    "start": "deno run --allow-net --allow-env --allow-read scheduler.ts"
  }
}
```

Then you can run:

```bash
deno task start
```

### Stop the scheduler

Press `Ctrl+C` in the terminal where the scheduler is running.

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `SCHEDULER_INTERVAL` | How often to trigger (milliseconds) | 30000 (30 seconds) |
| `SCHEDULER_SECRET` | Authentication secret | Required |
| `APP_URL` | Base URL of your app | http://localhost |
| `APP_PORT` | Port number (optional) | - |

## How It Works

1. **Startup**: The service starts and validates configuration
2. **Initial Trigger**: Immediately sends a POST request to `/api/scheduler/trigger`
3. **Regular Intervals**: Continues to send POST requests at the configured interval
4. **Statistics**: Tracks and displays success/failure statistics after each trigger
5. **Graceful Shutdown**: On Ctrl+C, displays final statistics and exits cleanly

## Example Output

```
=====================================
🚀 LOCAL SCHEDULER SERVICE
=====================================
📋 Mimics Google Cloud Scheduler
🔄 Mode: Development
=====================================

⚙️  CONFIGURATION
─────────────────────────────────────
Interval: 30000ms (30s)
Endpoint: http://localhost/api/scheduler/trigger
Secret: my-secret-...
─────────────────────────────────────

✅ Scheduler service started
⏰ Will trigger endpoint every 30 seconds
Press Ctrl+C to stop

[Scheduler] ⏰ Triggering scheduler endpoint...
[Scheduler] 🎯 Target: http://localhost/api/scheduler/trigger
[Scheduler] 📅 Time: 2024-01-15T10:30:00.000Z
[Scheduler] ✅ Trigger successful
[Scheduler] ⏱️  Duration: 124ms
[Scheduler] 📊 Response: { executed: 2, failed: 0, totalChecked: 5 }

─────────────────────────────────────
📈 SCHEDULER STATISTICS
─────────────────────────────────────
Total Triggers: 1
✅ Successful: 1
❌ Failed: 0
Success Rate: 100.0%
─────────────────────────────────────
```

## Troubleshooting

### Connection Refused

- **Problem**: `Connection refused` errors
- **Solution**: Ensure your main application is running on the configured URL/port

### Unauthorized (401)

- **Problem**: `401 Unauthorized` responses
- **Solution**: Check that `SCHEDULER_SECRET` matches between this service and your main app

### Wrong Endpoint

- **Problem**: `404 Not Found` errors
- **Solution**: Verify your main app has the `/api/scheduler/trigger` endpoint configured

## Development vs Production

### Development (This Service)
```
Local Scheduler Service
    ↓ (HTTP POST every 30s)
http://localhost/api/scheduler/trigger
    ↓
SchedulerService.checkSchedules()
```

### Production (Google Cloud Scheduler)
```
Google Cloud Scheduler
    ↓ (HTTP POST on schedule)
https://your-app.run.app/api/scheduler/trigger
    ↓
SchedulerService.checkSchedules()
```

The architecture is **identical** - only the source of the HTTP requests changes!

## Tips

- **Multiple Intervals**: Run multiple instances with different `.env` files for testing different schedules
- **Testing**: Set a short interval (e.g., 5000ms) during active development
- **Production**: This service is NOT needed in production - Google Cloud Scheduler handles it
- **Logging**: All requests are logged with timestamps and durations for easy debugging

## Security

- Keep your `.env` file secure and never commit it to version control
- Use strong, random values for `SCHEDULER_SECRET`
- In production, set secrets via environment variables, not in files
