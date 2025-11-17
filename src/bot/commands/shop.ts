import { Context } from 'telegraf';
import { userService } from '../../services/user.service';
import { characterService } from '../../services/character.service';

export async function handleShop(ctx: Context) {
  try {
    const userId = ctx.from!.id;
    const user = await userService.getUser(userId);

    if (!user) {
      await ctx.reply(ctx.i18n!.t('error'));
      return;
    }

    await ctx.reply(
      `${ctx.i18n!.t('shop_title')}\n\n` +
      `${ctx.i18n!.t('shop_balance', { balance: user.links_balance.toLocaleString() })}\n\n` +
      `${ctx.i18n!.t('shop_chest')}\n` +
      `${ctx.i18n!.t('shop_chances')}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎁 Открыть сундук (10,000 LINKS)', callback_data: 'open_chest' }]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Shop command error:', error);
    await ctx.reply(ctx.i18n!.t('error'));
  }
}

