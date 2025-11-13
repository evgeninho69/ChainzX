import { Context } from 'telegraf';
import { SessionData } from '../bot/middleware/session';

declare module 'telegraf' {
  interface Context {
    session?: SessionData;
    i18n?: {
      locale: string;
      t: (key: string, params?: Record<string, any>) => string;
    };
  }
}

