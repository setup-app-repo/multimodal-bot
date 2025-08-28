import { Injectable, Logger } from '@nestjs/common';
import { SetupAppConfigService } from './setup-app-config.service';
import { GrammyContext, SetupApp } from '@setup-app-repo/setup.app-sdk';

@Injectable()
export class SetupAppService {
  private readonly logger = new Logger(SetupAppService.name);
    private setupApp: SetupApp;

    constructor(private readonly setupAppConfigService: SetupAppConfigService) {
    }

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

      this.logger.log(`🚀 Setup.app SDK successfully initialized`, {
        baseUrl: config.baseUrl,
        hasServiceKey: !!config.serviceKey,
        enableLogging: config.enableLogging,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(` Failed to initialize Setup.app SDK:`, error);
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

  async getTravelsMiniappUrl() {
    return this.setupApp.getTravelsMiniappUrl();
  }

  async getReferralUrl(telegramId: number) {
    return this.setupApp.getReferralUrl(telegramId);
  }

  async setReferral(telegramId: number, referralId: number) {
    return this.setupApp.setReferral(telegramId, referralId, {firstName: 'test', lastName: 'test', username: 'test'});
  }

  async auth(telegramId: number, userData) {
    return this.setupApp.auth(telegramId, userData);
  }

  async have(telegramId: number, amount: number) {
    return this.setupApp.have(telegramId, amount);
  }

  async deduct(telegramId: number, amount: number, description: string) {
    return this.setupApp.deduct(telegramId, amount, description);
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
