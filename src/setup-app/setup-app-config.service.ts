import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SetupAppConfigService {
  constructor(private readonly configService: ConfigService) {}

  getConfig() {
    const baseUrl = this.configService.get<string>('SETUP_APP_BASE_URL');
    const serviceKey = this.configService.get<string>('SETUP_APP_SERVICE_KEY');

    if (!baseUrl) {
      throw new Error('SETUP_APP_BASE_URL is required in environment variables');
    }

    if (!serviceKey) {
      throw new Error('SETUP_APP_SERVICE_KEY is required in environment variables');
    }

    return {
      baseUrl,
      serviceKey,
      enableLogging: this.configService.get<boolean>('SETUP_APP_ENABLE_LOGGING', true),
    };
  }

  getBaseUrl(): string {
    return this.getConfig().baseUrl;
  }

  getServiceKey(): string {
    return this.getConfig().serviceKey;
  }

  isLoggingEnabled(): boolean {
    return this.getConfig().enableLogging ?? true;
  }

  validateConfig(): void {
    this.getConfig(); // Will throw if invalid
  }
}
