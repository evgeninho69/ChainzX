import { Context } from 'telegraf';
import { referralService } from '../../services/referral.service';
import { userService } from '../../services/user.service';

export async function handleTeam(ctx: Context) {
  try {
    const userId = ctx.from!.id;
    
    // Check if user exists
    const user = await userService.getUser(userId);
    if (!user) {
      await ctx.reply(ctx.i18n.t('error'));
      return;
    }

    const tree = await referralService.getReferralTree(userId);

    let message = `${ctx.i18n.t('team_title')}\n\n`;
    
    message += `${ctx.i18n.t('team_level1')}\n`;
    if (tree.level1.length === 0) {
      message += `└─ ${ctx.i18n.t('team_no_friends') || 'No friends yet'}\n`;
    } else {
      tree.level1.forEach((ref, idx) => {
        const prefix = idx === tree.level1.length - 1 ? '└─' : '├─';
        const username = ref.username ? `@${ref.username}` : 'Anonymous';
        message += `${prefix} ${username} — ${ref.links_balance.toLocaleString()} LINKS (${ref.referral_count} friends)\n`;
      });
    }

    message += `\n${ctx.i18n.t('team_level2')}\n`;
    message += `└─ ${tree.level2.length} ${ctx.i18n.t('team_people') || 'people'}\n`;

    message += `\n${ctx.i18n.t('team_income', {
      l1: tree.level1Earnings.toLocaleString(),
      l2: tree.level2Earnings.toLocaleString(),
      total: (tree.level1Earnings + tree.level2Earnings).toLocaleString()
    })}`;

    await ctx.reply(message);
  } catch (error) {
    console.error('Team command error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    try {
      await ctx.reply(ctx.i18n.t('error'));
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

