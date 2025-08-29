import { Context, SessionFlavor } from 'grammy';

export type SessionData = {
    model?: string;
    lang?: string;
    premiumAutorenew?: boolean;
    premiumExpiresAt?: string; // ISO строка даты истечения премиума
};
export type BotContext = Context & SessionFlavor<SessionData>;