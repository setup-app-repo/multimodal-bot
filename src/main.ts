import { initSentryFromConfig } from './config/sentry.config';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './config/app-config.service';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { initDatadogFromConfig } from './config/datadog.config';

// Polyfill for fetch in Node.js
if (!global.fetch) {
  import('node-fetch').then(({ default: fetch }) => {
    (global as any).fetch = fetch;
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  // Инициализация Sentry через конфиг сервис
  const appConfig = app.get(AppConfigService);
  initSentryFromConfig(appConfig);

  // Инициализация Datadog
  initDatadogFromConfig(appConfig);

  await app.listen(config.get<number>('PORT') ?? 3000);
}
bootstrap();
