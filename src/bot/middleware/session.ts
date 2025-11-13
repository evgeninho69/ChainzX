import { Context } from 'telegraf';

export interface SessionData {
  awaitingGuildName?: boolean;
  awaitingLanguage?: boolean;
}

export const sessionMiddleware = () => {
  const sessions = new Map<number, SessionData>();

  return async (ctx: Context, next: () => Promise<void>) => {
    const userId = ctx.from?.id;
    if (!userId) {
      return next();
    }

    if (!sessions.has(userId)) {
      sessions.set(userId, {});
    }

    ctx.session = sessions.get(userId)!;
    await next();
  };
};

