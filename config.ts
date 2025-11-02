// Configuration for the local scheduler service
// This mimics Google Cloud Scheduler behavior for local development

export interface SchedulerConfig {
    // How often to trigger the scheduler endpoint (in milliseconds)
    interval: number;

    // The secret used to authenticate with the scheduler endpoint
    schedulerSecret: string;

    // The base URL of your application
    appUrl: string;

    // Optional: Custom port if not using default
    appPort?: number;
}

/**
 * Load configuration from environment variables or use defaults
 */
export function loadConfig(): SchedulerConfig {
    const interval = parseInt(Deno.env.get('SCHEDULER_INTERVAL') || '30000', 10);
    const schedulerSecret = Deno.env.get('SCHEDULER_SECRET') || '';
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost';
    const appPort = Deno.env.get('APP_PORT') ? parseInt(Deno.env.get('APP_PORT')!, 10) : undefined;

    if (!schedulerSecret) {
        console.error('❌ ERROR: SCHEDULER_SECRET environment variable is required');
        console.error('Please set SCHEDULER_SECRET in your .env file or environment');
        Deno.exit(1);
    }

    return {
        interval,
        schedulerSecret,
        appUrl,
        appPort,
    };
}

/**
 * Build the full scheduler endpoint URL
 */
export function buildEndpointUrl(config: SchedulerConfig): string {
    const base = config.appPort
        ? `${config.appUrl}:${config.appPort}`
        : config.appUrl;

    return `${base}/api/scheduler/trigger`;
}

/**
 * Validate configuration
 */
export function validateConfig(config: SchedulerConfig): void {
    if (config.interval < 1000) {
        console.warn('⚠️  WARNING: Interval is less than 1 second. This may cause high load.');
    }

    if (config.interval < 5000) {
        console.warn('⚠️  WARNING: Interval is less than 5 seconds. Consider using a longer interval.');
    }
}
