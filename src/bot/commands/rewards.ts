import { Context } from 'telegraf';

export async function handleRewards(ctx: Context) {
  try {
    // Calculate days until end of week (Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;

    await ctx.reply(
      `${ctx.i18n.t('rewards_title', { days: daysUntilSunday })}\n\n` +
      `🎁 PRIZE POOL:\n\n` +
      `${ctx.i18n.t('rewards_personal')}\n` +
      `🏅 Top 10: 5,000 CROWNS each\n` +
      `🏅 Top 100: 1,000 CROWNS each\n\n` +
      `${ctx.i18n.t('rewards_team')}\n\n` +
      `CROWNS = premium currency (limited!)`
    );
  } catch (error) {
    console.error('Rewards command error:', error);
    await ctx.reply(ctx.i18n.t('error'));
  }
}

