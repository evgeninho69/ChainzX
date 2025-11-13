import { Context } from 'telegraf';
import { referralService } from '../../services/referral.service';
import { leaderboardService } from '../../services/leaderboard.service';

export async function handleInvite(ctx: Context) {
  try {
    const userId = ctx.from!.id;
    const botUsername = ctx.botInfo?.username || 'ChainzX_bot';
    const inviteLink = `https://t.me/${botUsername}?start=${userId}`;

    // Get stats
    const referralCount = await referralService.getUserReferralCount(userId, 1);
    const rank = await leaderboardService.getUserRank(userId);

    let message = `🚀 ПРИГЛАСИ ДРУЗЕЙ!\n\n`;
    message += `Твоя уникальная ссылка:\n`;
    message += `🔗 ${inviteLink}\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💰 ТВОЙ ЗАРАБОТОК:\n\n`;
    message += `┌─ Level 1 (Прямые друзья)\n`;
    message += `│  💎 +1,000 LINKS за каждого\n│\n`;
    message += `└─ Level 2 (Друзья твоих друзей)\n`;
    message += `   💎 +100 LINKS за каждого\n\n`;
    
    message += `∞ ПРИМЕР:\n`;
    message += `Ты пригласил 10 друзей = 10,000 LINKS\n`;
    message += `Каждый пригласил по 5 = +5,000 LINKS\n`;
    message += `═══════════════════════════════\n`;
    message += `ИТОГО: 15,000 LINKS! 🔥\n\n`;
    
    message += `📊 Твоя текущая цепь: ${referralCount} человек\n`;
    message += `🏆 Место в топе: #${rank}\n\n`;
    
    message += `💡 Чем больше цепь, тем больше пассивный доход!`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 Копировать ссылку', callback_data: `copy_link:${userId}` }
          ],
          [
            { 
              text: '📤 Поделиться', 
              url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Присоединяйся к ChainzX! 🚀')}` 
            }
          ],
          [
            { text: '📊 Моя команда', callback_data: 'menu_team' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Invite command error:', error);
    await ctx.reply(ctx.i18n.t('error'));
  }
}
