import { Context } from 'telegraf';

export async function handleHelp(ctx: Context) {
  await ctx.reply(ctx.i18n.t('help'));
}

