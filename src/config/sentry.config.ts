import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { AppConfigService } from './app-config.service';

export function initSentryFromConfig(config: AppConfigService) {
    const dsn = config.sentryDsn;
    if (!dsn) {
        // eslint-disable-next-line no-console
        console.log('[Sentry] DSN not provided, Sentry disabled');
        return;
    }

    const env = config.nodeEnv || 'development';
    const tracesRate =
        config.sentryTracesSampleRate ?? (env === 'production' ? 0.1 : 0.3);
    const profilesRate =
        config.sentryProfilesSampleRate ?? (env === 'production' ? 0.1 : 0.1);

    Sentry.init({
        dsn,
        environment: env,
        release: process.env.npm_package_version,
        debug: config.sentryDebug,
        tracesSampleRate: tracesRate,
        profilesSampleRate: profilesRate,
        integrations: [
            ...(env === 'production' ? [nodeProfilingIntegration()] : []),
            Sentry.consoleIntegration({ levels: ['log', 'warn', 'error'] }),
        ],
        beforeSend(event) {
            if (env === 'development' && !config.sentryDebug) {
                return null;
            }
            if (event.extra) {
                (event.extra as any).timestamp = new Date().toISOString();
                (event.extra as any).pid = process.pid;
            }
            return event;
        },
        beforeSendTransaction(event) {
            if (env === 'production' && event.transaction) {
                const duration =
                    event.timestamp && event.start_timestamp
                        ? (event.timestamp - event.start_timestamp) * 1000
                        : 0;
                if (duration < 1000) return null;
            }
            return event;
        },
    });

    if (env === 'development' && !config.sentryVerbose) {
        const originalConsoleLog = console.log;
        const originalConsoleWarn = console.warn;
        console.log = (...args: any[]) => {
            const message = args.map(String).join(' ');
            if (
                message.includes('Sentry Logger [log]:') ||
                message.includes('@opentelemetry_sentry-patched') ||
                message.includes('@sentry/instrumentation') ||
                message.includes('[Tracing]') ||
                message.includes('[Profiling]')
            ) {
                return;
            }
            originalConsoleLog.apply(console, args as any);
        };
        console.warn = (...args: any[]) => {
            const message = args.map(String).join(' ');
            if (message.includes('Sentry Logger [warn]:') && !message.includes('Discarded session')) {
                originalConsoleWarn.apply(console, args as any);
            } else if (!message.includes('Sentry Logger')) {
                originalConsoleWarn.apply(console, args as any);
            }
        };
    }

    // eslint-disable-next-line no-console
    console.log(`[Sentry] Initialized for environment: ${env} with console integration`);
}


