import { Context } from 'telegraf';

export const loggerMiddleware = async (ctx: Context, next: () => Promise<void>) => {
  const start = Date.now();
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  const command = ctx.message && 'text' in ctx.message ? ctx.message.text : 'callback';

  console.log(`[${new Date().toISOString()}] User ${userId} (@${username}) - ${command}`);

  await next();

  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`Slow command: ${command} took ${duration}ms`);
  }
};

