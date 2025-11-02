#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read
// Local Scheduler Service
// This standalone service mimics Google Cloud Scheduler for local development
// It sends HTTP POST requests to the scheduler trigger endpoint at regular intervals

import { loadConfig, buildEndpointUrl, validateConfig } from './config.ts';

// Track statistics
let totalTriggers = 0;
let successfulTriggers = 0;
let failedTriggers = 0;
let lastTriggerTime: Date | null = null;
let lastStatus: 'success' | 'failed' | null = null;

/**
 * Main scheduler function that triggers the endpoint
 */
async function triggerScheduler(endpointUrl: string, secret: string): Promise<void> {
    const startTime = Date.now();
    totalTriggers++;
    lastTriggerTime = new Date();

    console.log('');
    console.log('[Scheduler] ⏰ Triggering scheduler endpoint...');
    console.log(`[Scheduler] 🎯 Target: ${endpointUrl}`);
    console.log(`[Scheduler] 📅 Time: ${lastTriggerTime.toISOString()}`);

    try {
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Scheduler-Secret': secret,
            },
            body: JSON.stringify({}),
        });

        const duration = Date.now() - startTime;

        if (response.ok) {
            const result = await response.json();
            successfulTriggers++;
            lastStatus = 'success';

            console.log('[Scheduler] ✅ Trigger successful');
            console.log(`[Scheduler] ⏱️  Duration: ${duration}ms`);
            console.log(`[Scheduler] 📊 Response:`, result);
        } else {
            failedTriggers++;
            lastStatus = 'failed';

            const errorText = await response.text();
            console.error('[Scheduler] ❌ Trigger failed');
            console.error(`[Scheduler] 📊 Status: ${response.status} ${response.statusText}`);
            console.error(`[Scheduler] ⏱️  Duration: ${duration}ms`);
            console.error(`[Scheduler] 📝 Error: ${errorText}`);
        }
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        failedTriggers++;
        lastStatus = 'failed';

        console.error('[Scheduler] ❌ Request error');
        console.error(`[Scheduler] ⏱️  Duration: ${duration}ms`);
        console.error(`[Scheduler] 📝 Error:`, error instanceof Error ? error.message : String(error));
    }

    // Print statistics
    console.log('');
    console.log('─────────────────────────────────────');
    console.log('📈 SCHEDULER STATISTICS');
    console.log('─────────────────────────────────────');
    console.log(`Total Triggers: ${totalTriggers}`);
    console.log(`✅ Successful: ${successfulTriggers}`);
    console.log(`❌ Failed: ${failedTriggers}`);
    console.log(`Success Rate: ${totalTriggers > 0 ? ((successfulTriggers / totalTriggers) * 100).toFixed(1) : 0}%`);
    console.log('─────────────────────────────────────');
    console.log('');
}

/**
 * Main entry point
 */
async function main() {
    console.log('');
    console.log('=====================================');
    console.log('🚀 LOCAL SCHEDULER SERVICE');
    console.log('=====================================');
    console.log('📋 Mimics Google Cloud Scheduler');
    console.log('🔄 Mode: Development');
    console.log('=====================================');
    console.log('');

    // Load and validate configuration
    const config = loadConfig();
    const endpointUrl = buildEndpointUrl(config);

    validateConfig(config);

    console.log('⚙️  CONFIGURATION');
    console.log('─────────────────────────────────────');
    console.log(`Interval: ${config.interval}ms (${config.interval / 1000}s)`);
    console.log(`Endpoint: ${endpointUrl}`);
    console.log(`Secret: ${config.schedulerSecret.substring(0, 10)}...`);
    console.log('─────────────────────────────────────');
    console.log('');

    console.log('✅ Scheduler service started');
    console.log(`⏰ Will trigger endpoint every ${config.interval / 1000} seconds`);
    console.log('Press Ctrl+C to stop');
    console.log('');

    // Run immediately on startup
    await triggerScheduler(endpointUrl, config.schedulerSecret);

    // Then run at specified interval
    setInterval(async () => {
        await triggerScheduler(endpointUrl, config.schedulerSecret);
    }, config.interval);
}

// Handle graceful shutdown
Deno.addSignalListener('SIGINT', () => {
    console.log('');
    console.log('🛑 Scheduler service stopping...');
    console.log('');
    console.log('📊 FINAL STATISTICS');
    console.log('─────────────────────────────────────');
    console.log(`Total Triggers: ${totalTriggers}`);
    console.log(`✅ Successful: ${successfulTriggers}`);
    console.log(`❌ Failed: ${failedTriggers}`);
    console.log('─────────────────────────────────────');
    console.log('');
    console.log('👋 Goodbye!');
    Deno.exit(0);
});

// Start the service
if (import.meta.main) {
    main().catch((error) => {
        console.error('❌ Fatal error:', error);
        Deno.exit(1);
    });
}
