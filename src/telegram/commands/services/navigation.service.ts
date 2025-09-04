import { InlineKeyboard } from 'grammy';

import { BotContext } from '../../interfaces';
import { ProfileScreen, PremiumScreen, ModelScreen } from '../screens';
import {
  renderScreen,
  KeyboardBuilder,
  safeAnswerCallbackQuery,
  RouteId,
  RouteParams,
  RegisterCommandsDeps,
  ScreenData,
} from '../utils';

export class NavigationService {
  private profileScreen: ProfileScreen;
  private premiumScreen: PremiumScreen;
  private modelScreen: ModelScreen;

  constructor(private deps: RegisterCommandsDeps) {
    this.profileScreen = new ProfileScreen(deps);
    this.premiumScreen = new PremiumScreen(deps);
    this.modelScreen = new ModelScreen(deps);
  }

  async buildRouteScreen(
    ctx: BotContext,
    route: RouteId,
    params?: RouteParams,
  ): Promise<ScreenData> {
    if (route === 'profile') {
      return this.profileScreen.build(ctx);
    }
    if (route === 'profile_language') {
      const { t } = this.deps;
      const kb = KeyboardBuilder.buildLanguageInlineKeyboard(ctx, t)
        .row()
        .text(t(ctx, 'back_button'), 'ui:back');
      return { text: t(ctx, 'choose_language'), keyboard: kb };
    }
    if (route === 'profile_clear') {
      const { t } = this.deps;
      const keyboard = new InlineKeyboard()
        .text(t(ctx, 'clear_yes_button'), 'clear:confirm')
        .row()
        .text(t(ctx, 'back_button'), 'ui:back');
      const confirmText = t(ctx, 'clear_confirm').replace(/\*\*(.+?)\*\*/g, '*$1*');
      return { text: confirmText, keyboard, parse_mode: 'Markdown' };
    }
    if (route === 'premium') {
      const telegramId = ctx.from?.id as number;
      const hasActive = await this.deps.subscriptionService.hasActiveSubscription(
        String(telegramId),
      );
      if (hasActive) {
        return this.premiumScreen.buildActive(ctx);
      }
      return this.premiumScreen.build(ctx);
    }
    if (route === 'model_connected') {
      return this.modelScreen.buildConnected(ctx, params?.model);
    }
    return { text: this.deps.t(ctx, 'unexpected_error') };
  }

  async navigateTo(ctx: BotContext, route: RouteId, params?: RouteParams) {
    ctx.session.uiStack = ctx.session.uiStack || [];
    if (ctx.session.currentRoute) {
      ctx.session.uiStack.push(ctx.session.currentRoute);
    }
    ctx.session.currentRoute = { route, params };
    const screen = await this.buildRouteScreen(ctx, route, params);
    await renderScreen(ctx, screen);
  }

  async navigateBack(ctx: BotContext) {
    ctx.session.uiStack = ctx.session.uiStack || [];
    const previous = ctx.session.uiStack.pop();
    if (!previous) {
      // Если пришли из премиума или выбора языка и стека нет — показываем профиль
      if (
        ctx.session.currentRoute?.route === 'premium' ||
        ctx.session.currentRoute?.route === 'profile_language'
      ) {
        ctx.session.currentRoute = { route: 'profile' } as any;
        const screen = await this.buildRouteScreen(ctx, 'profile');
        await renderScreen(ctx, screen);
        return;
      }
      await safeAnswerCallbackQuery(ctx);
      try {
        await ctx.deleteMessage();
      } catch { }
      return;
    }
    ctx.session.currentRoute = previous;
    const screen = await this.buildRouteScreen(ctx, previous.route as RouteId, previous.params);
    await renderScreen(ctx, screen);
  }
}
