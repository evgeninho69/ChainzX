import { Context } from 'telegraf';
import { userService } from '../../services/user.service';

export async function handleBalance(ctx: Context) {
  try {
    const userId = ctx.from!.id;
    const user = await userService.getUser(userId);

    if (!user) {
      await ctx.reply(ctx.i18n.t('error'));
      return;
    }

    await ctx.reply(
      ctx.i18n.t('balance', {
        balance: user.links_balance,
        crowns: user.crowns_balance
      })
    );
  } catch (error) {
    console.error('Balance command error:', error);
    await ctx.reply(ctx.i18n.t('error'));
  }
}

