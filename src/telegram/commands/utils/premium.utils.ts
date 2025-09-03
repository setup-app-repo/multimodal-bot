import { BotContext } from '../../interfaces';

export const ensurePremiumDefaults = (ctx: BotContext) => {
  if (!ctx.session.premiumExpiresAt) {
    const addDays = 30;
    const expires = new Date(Date.now() + addDays * 24 * 60 * 60 * 1000);
    ctx.session.premiumExpiresAt = expires.toISOString();
  }
  if (typeof ctx.session.premiumAutorenew === 'undefined') {
    ctx.session.premiumAutorenew = false;
  }
};
