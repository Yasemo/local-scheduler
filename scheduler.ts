// scheduler.ts - Local scheduler for triggering query, cleanup, and output executions

interface SchedulerConfig {
  symposiumUrl: string;
  checkInterval: number; // milliseconds
  authToken?: string;
}

class LocalScheduler {
  private config: SchedulerConfig;
  private running: boolean = false;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.running) {
      console.log('[Scheduler] Already running');
      return;
    }

    this.running = true;
    console.log(`[Scheduler] Starting with ${this.config.checkInterval}ms interval`);
    console.log(`[Scheduler] Target URL: ${this.config.symposiumUrl}`);

    // Run immediately on start
    this.triggerCheck();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.triggerCheck();
    }, this.config.checkInterval);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.running) {
      console.log('[Scheduler] Not running');
      return;
    }

    this.running = false;
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('[Scheduler] Stopped');
  }

  /**
   * Trigger a check for due queries, cleanups, and outputs
   */
  private async triggerCheck() {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Checking for scheduled tasks...`);

    // Check queries
    await this.triggerQueries();

    // Check cleanups
    await this.triggerCleanups();

    // Check outputs
    await this.triggerOutputs();
  }

  /**
   * Trigger scheduled queries
   */
  private async triggerQueries() {
    try {
      const url = `${this.config.symposiumUrl}/api/scheduler/trigger`;
      const headers: Record<string, string> = {};

      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        console.error(`[Queries] HTTP error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        const executedCount = data.data?.executed_count || 0;
        if (executedCount > 0) {
          console.log(`[Queries] ✓ Executed ${executedCount} scheduled ${executedCount === 1 ? 'query' : 'queries'}`);

          if (data.data?.results) {
            data.data.results.forEach((result: any) => {
              const status = result.success ? '✓' : '✗';
              console.log(`  ${status} ${result.query_name} (${result.query_id})`);
              if (result.error) {
                console.log(`    Error: ${result.error}`);
              }
            });
          }
        } else {
          console.log('[Queries] ○ No queries due for execution');
        }
      } else {
        console.error(`[Queries] Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Queries] Failed to trigger check:', errorMessage);
    }
  }

  /**
   * Trigger scheduled cleanups
   */
  private async triggerCleanups() {
    try {
      const url = `${this.config.symposiumUrl}/api/scheduler/trigger-cleanups`;
      const headers: Record<string, string> = {};

      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        console.error(`[Cleanups] HTTP error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        const executedCount = data.data?.executed_count || 0;
        if (executedCount > 0) {
          console.log(`[Cleanups] ✓ Executed ${executedCount} scheduled ${executedCount === 1 ? 'cleanup' : 'cleanups'}`);

          if (data.data?.results) {
            data.data.results.forEach((result: any) => {
              const status = result.success ? '✓' : '✗';
              console.log(`  ${status} ${result.cleanup_name} (${result.cleanup_id}): Deleted ${result.deleted_count} card(s)`);
              if (result.error) {
                console.log(`    Error: ${result.error}`);
              }
            });
          }
        } else {
          console.log('[Cleanups] ○ No cleanups due for execution');
        }
      } else {
        console.error(`[Cleanups] Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Cleanups] Failed to trigger check:', errorMessage);
    }
  }

  /**
   * Trigger scheduled outputs
   */
  private async triggerOutputs() {
    try {
      const url = `${this.config.symposiumUrl}/api/scheduler/trigger-outputs`;
      const headers: Record<string, string> = {};

      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        console.error(`[Outputs] HTTP error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        const executedCount = data.data?.executed_count || 0;
        if (executedCount > 0) {
          console.log(`[Outputs] ✓ Executed ${executedCount} scheduled ${executedCount === 1 ? 'output' : 'outputs'}`);

          if (data.data?.results) {
            data.data.results.forEach((result: any) => {
              const status = result.success ? '✓' : '✗';
              console.log(`  ${status} ${result.output_name} (${result.output_id}): Sent ${result.sent_count} card(s)`);
              if (result.error) {
                console.log(`    Error: ${result.error}`);
              }
            });
          }
        } else {
          console.log('[Outputs] ○ No outputs due for execution');
        }
      } else {
        console.error(`[Outputs] Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Outputs] Failed to trigger check:', errorMessage);
    }
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.running;
  }
}

/**
 * Load configuration from environment or use defaults
 */
function loadConfig(): SchedulerConfig {
  const getEnv = (key: string): string | undefined => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    // Deno environment
    if (typeof Deno !== 'undefined' && Deno.env) {
      return Deno.env.get(key);
    }
    return undefined;
  };

  return {
    symposiumUrl: getEnv('SYMPOSIUM_URL') || 'http://localhost:80',
    checkInterval: parseInt(getEnv('CHECK_INTERVAL_MS') || '60000'), // Default: 1 minute
    authToken: getEnv('AUTH_TOKEN'),
  };
}

/**
 * Main entry point
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Local Scheduler for Symposium');
  console.log('  - Queries: Scheduled data retrieval');
  console.log('  - Cleanups: Automated card deletion');
  console.log('  - Outputs: Automated card distribution');
  console.log('='.repeat(60));

  const config = loadConfig();
  const scheduler = new LocalScheduler(config);

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n[Scheduler] Shutting down...');
    scheduler.stop();
    if (typeof process !== 'undefined') {
      process.exit(0);
    } else if (typeof Deno !== 'undefined') {
      Deno.exit(0);
    }
  };

  // Listen for shutdown signals
  if (typeof process !== 'undefined') {
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } else if (typeof Deno !== 'undefined') {
    Deno.addSignalListener('SIGINT', shutdown);
    Deno.addSignalListener('SIGTERM', shutdown);
  }

  // Start the scheduler
  scheduler.start();

  // Keep the process alive
  console.log('\n[Scheduler] Press Ctrl+C to stop\n');
  await new Promise(() => { }); // Never resolves, keeps process alive
}

// Run if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  main();
} else if (typeof Deno !== 'undefined' && import.meta.main) {
  main();
}
