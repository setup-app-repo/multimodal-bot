import tracer from 'dd-trace';
import { AppConfigService } from './app-config.service';

export function initDatadogFromConfig(config: AppConfigService) {
    const service = config.datadogService || 'multimodal-bot';
    const env = config.nodeEnv || 'development';
    const url = config.datadogUrl || 'http://localhost:8126';
    const enabled = config.datadogEnabled ?? (env === 'production');

    if (!enabled) {
        console.log('[Datadog] Tracing disabled');
        return;
    }

    tracer.init({
        service,
        env,
        url,
        logInjection: true,
        runtimeMetrics: true,
        profiling: false,
    });

    console.log(`[Datadog] Initialized for environment: ${env}`);
}
