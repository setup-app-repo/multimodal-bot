import { Context, SessionFlavor } from 'grammy';

export type SessionData = { model?: string; lang?: string };
export type BotContext = Context & SessionFlavor<SessionData>;