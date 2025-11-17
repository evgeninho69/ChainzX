import { Context } from 'telegraf';
import { leaderboardService } from '../../services/leaderboard.service';
import { getMedalEmoji } from '../../utils/helpers';

export async function handleLeaderboard(ctx: Context) {
  try {
    const userId = ctx.from!.id;
    const topUsers = await leaderboardService.getTopUsers(100);
    const userRank = await leaderboardService.getUserRank(userId);
    const userLinks = await leaderboardService.getUserLinks(userId);

    let message = `${ctx.i18n!.t('leaderboard_title')}\n\n`;

    // Show top 10
    const top10 = topUsers.slice(0, 10);
    top10.forEach((user, idx) => {
      const rank = idx + 1;
      const medal = getMedalEmoji(rank);
      const username = user.username || 'Anonymous';
      message += `${medal} @${username} — ${user.links_balance.toLocaleString()} LINKS (${user.referral_count} friends)\n`;
    });

    // Show user's position
    message += ctx.i18n!.t('leaderboard_you', {
      rank: userRank,
      links: userLinks.toLocaleString()
    });

    await ctx.reply(message);
  } catch (error) {
    console.error('Leaderboard command error:', error);
    await ctx.reply(ctx.i18n!.t('error'));
  }
}

