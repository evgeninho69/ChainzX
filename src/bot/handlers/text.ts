import { Context } from 'telegraf';
import { guildService } from '../../services/guild.service';

export async function handleText(ctx: Context) {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const userId = ctx.from!.id;

  // Handle guild name input
  if (ctx.session?.awaitingGuildName) {
    const guildName = text.trim();

    if (guildName.length > 30) {
      await ctx.reply(ctx.i18n!.t('guild_name_too_long'));
      return;
    }

    if (guildName.length < 3) {
      await ctx.reply('❌ Name too short! Minimum 3 characters.');
      return;
    }

    try {
      const guild = await guildService.createGuild(guildName, userId);
      if (ctx.session) {
        ctx.session.awaitingGuildName = false;
      }
      await ctx.reply(ctx.i18n!.t('guild_created', { name: guild.name }));
    } catch (error: any) {
      if (error.message === 'Guild name already exists') {
        await ctx.reply(ctx.i18n!.t('guild_name_exists'));
      } else {
        await ctx.reply(ctx.i18n!.t('error'));
      }
    }
    return;
  }

  // Default: show help
  await ctx.reply(ctx.i18n!.t('help'));
}

