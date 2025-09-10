import { Injectable } from '@nestjs/common';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { EUserLogType } from 'src/user-logs/user-log.entity';
import { GrammyContext, SetupApp } from '@setup-app-repo/setup.app-sdk';

import { SetupAppConfigService } from './setup-app-config.service';
import { ISetupAppUserData } from './interfaces';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

@Injectable()
export class SetupAppService {
  private setupApp: SetupApp;

  constructor(
    private readonly setupAppConfigService: SetupAppConfigService,
    private readonly userLogsService: UserLogsService,
    private readonly logger: WinstonLoggerService,
  ) { }

  async onModuleInit(): Promise<void> {
    try {
      // Валидируем конфигурацию перед инициализацией
      this.setupAppConfigService.validateConfig();
      const config = this.setupAppConfigService.getConfig();

      // Инициализируем SDK (быстро, без сетевых вызовов)
      this.setupApp = new SetupApp({
        baseUrl: config.baseUrl,
        serviceKey: config.serviceKey,
        enableLogging: config.enableLogging ?? true,
      });

      this.logger.logWithMeta('info', 'Setup.app SDK initialized', {
        baseUrl: config.baseUrl,
        hasServiceKey: !!config.serviceKey,
        enableLogging: config.enableLogging ?? true,
        serviceKeyLength: (config.serviceKey || '').length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.logWithMeta('error', 'Failed to initialize Setup.app SDK', {
        errorName: (error as any)?.name,
        errorMessage: (error as any)?.message ?? String(error),
        stack: (error as any)?.stack,
        service: 'setup-app',
        context: 'SetupAppService',
      });
      throw error;
    }
  }

  async getIntegrationInfo() {
    return this.setupApp.getIntegrationInfo();
  }

  async getUrls() {
    return this.setupApp.getUrls();
  }

  async getMiniappUrl() {
    return this.setupApp.getMiniappUrl();
  }

  async getBuySetupPointsUrl() {
    return this.setupApp.getBuySetupPointsUrl();
  }

  async getBuyCreditsUrl() {
    return this.setupApp.getBuyCreditsUrl();
  }

  async getTelegramMiniappUrl() {
    return this.setupApp.getTelegramMiniappUrl();
  }

  async getReferralUrl(telegramId: number) {
    return this.setupApp.getReferralUrl(telegramId);
  }

  async setReferral(telegramId: number, referralId: number, userData: ISetupAppUserData) {
    return this.setupApp.setReferral(telegramId, referralId, userData);
  }

  async auth(telegramId: number, userData) {
    return this.setupApp.auth(telegramId, userData);
  }

  async have(telegramId: number, amount: number) {
    return this.setupApp.have(telegramId, amount);
  }

  async deduct(telegramId: number, amount: number, description: string) {
    const result = await this.setupApp.deduct(telegramId, amount, description);
    try {
      await this.userLogsService.log(String(telegramId), EUserLogType.DEDUCT, amount, description);
    } catch (e) {
      this.logger.warn(`Failed to write user log for deduct: ${String(e)}`, SetupAppService.name);
    }
    return result;
  }

  async getBalance(telegramId: number) {
    return this.setupApp.getBalance(telegramId);
  }

  async setupMenuButton(ctx: GrammyContext, options) {
    return this.setupApp.setupMenuButton(ctx, options);
  }

  isInitialized(): boolean {
    return !!this.setupApp;
  }

  getConfig() {
    return this.setupApp.getConfig();
  }

  setLogging(enabled: boolean) {
    this.setupApp.setLogging(enabled);
  }
}
