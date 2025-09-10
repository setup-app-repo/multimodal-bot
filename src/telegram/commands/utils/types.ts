import { InlineKeyboard } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { UserService } from 'src/user/user.service';

import { BotContext } from '../../interfaces';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

export type TranslateFn = (ctx: BotContext, key: string, args?: Record<string, any>) => string;

export interface RegisterCommandsDeps {
  t: TranslateFn;
  i18n: I18nService;
  redisService: RedisService;
  setupAppService: SetupAppService;
  userService: UserService;
  subscriptionService: SubscriptionService;
  logger: WinstonLoggerService;
}

export type ScreenData = {
  text: string;
  keyboard?: InlineKeyboard;
  parse_mode?: 'HTML' | 'Markdown';
};

export type RouteId =
  | 'profile'
  | 'profile_language'
  | 'profile_clear'
  | 'premium'
  | 'model_connected';
export type RouteParams = Record<string, any> | undefined;
