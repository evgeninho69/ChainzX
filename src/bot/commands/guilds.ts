import { Context } from 'telegraf';
import { guildService } from '../../services/guild.service';
import { getMedalEmoji } from '../../utils/helpers';

export async function handleGuilds(ctx: Context) {
  try {
    const userId = ctx.from!.id;
    const topGuilds = await guildService.getTopGuilds(10);
    const userGuild = await guildService.getUserGuild(userId);

    let message = `${ctx.i18n.t('guilds_title')}\n\n`;

    topGuilds.forEach((guild, idx) => {
      const rank = idx + 1;
      const medal = getMedalEmoji(rank);
      message += `${medal} ${guild.name} — ${guild.total_links.toLocaleString()} LINKS (${guild.member_count} players)\n`;
    });

    if (userGuild) {
      message += ctx.i18n.t('guild_your_team', { name: userGuild.name });
    } else {
      message += ctx.i18n.t('guild_no_team');
    }

    const keyboard = [
      [{ text: '➕ Create team', callback_data: 'guild_create' }],
      [{ text: '🔍 Browse teams', callback_data: 'guild_browse' }]
    ];

    if (userGuild) {
      keyboard.push([{ text: '🚪 Leave team', callback_data: 'guild_leave' }]);
    }

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Guilds command error:', error);
    await ctx.reply(ctx.i18n.t('error'));
  }
}

