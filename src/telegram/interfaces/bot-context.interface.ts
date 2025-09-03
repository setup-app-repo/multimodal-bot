import { Context, SessionFlavor } from 'grammy';

export type SessionData = {
  model?: string;
  lang?: string;
  premiumAutorenew?: boolean;
  premiumExpiresAt?: string; // ISO строка даты истечения премиума
  // Стек экранов и текущий экран для реализации Back
  uiStack?: { route: string; params?: Record<string, any> }[];
  currentRoute?: { route: string; params?: Record<string, any> };
};
export type BotContext = Context & SessionFlavor<SessionData>;
