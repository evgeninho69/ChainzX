import { Context } from 'telegraf';
import { userService } from '../../services/user.service';
import { referralService } from '../../services/referral.service';
import { characterService } from '../../services/character.service';
import { leaderboardService } from '../../services/leaderboard.service';
import { CHARACTERS } from '../../data/characters';

export async function handleStart(ctx: Context) {
  try {
    console.log('Start command received from:', ctx.from?.id, ctx.from?.username);
    
    const telegramId = ctx.from!.id;
    const username = ctx.from!.username;
    const firstName = ctx.from!.first_name;
    const languageCode = ctx.from!.language_code || 'en';
    
    // Parse referral code from start payload
    const startPayload = ctx.message && 'text' in ctx.message 
      ? ctx.message.text.split(' ')[1] 
      : null;
    const referrerId = startPayload ? parseInt(startPayload) : null;
    
    console.log('Processing start for user:', telegramId, 'referrer:', referrerId);

    // Check if user exists
    let user = await userService.getUser(telegramId);

    if (!user) {
      // Create new user
      user = await userService.createUser({
        telegram_id: telegramId,
        username: username || null,
        first_name: firstName || null,
        language_code: languageCode,
        referrer_id: referrerId || null,
      });

      // Process referral if exists
      if (referrerId && referrerId !== telegramId) {
        await referralService.processReferral(telegramId, referrerId);
        
        // Notify referrer
        try {
          await ctx.telegram.sendMessage(
            referrerId,
            ctx.i18n!.t('referral_joined', { username: username || firstName || 'Someone' })
          );
        } catch (error) {
          console.error('Failed to notify referrer:', error);
        }
      }
    } else {
      // Update last active
      await userService.updateLastActive(telegramId);
    }

    // Check if user needs to select language (first time - only for new users without character)
    // Show language selection only if user was just created and doesn't have a character yet
    if (!user.character_id && (!user.language_code || (user.language_code === 'en' && !ctx.from?.language_code))) {
      // Show language selection for new users
      await ctx.reply(
        ctx.i18n!.t('language_title'),
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
              [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
              [{ text: '🇪🇸 Español', callback_data: 'lang_es' }],
              [{ text: '🇵🇹 Português', callback_data: 'lang_pt' }],
              [{ text: '🇮🇳 हिन्दी', callback_data: 'lang_hi' }]
            ]
          }
        }
      );
      return;
    }

    // Check if user has selected character
    if (!user.character_id) {
      // Show character selection
      const starterCharacters = CHARACTERS.filter(c => c.cost === 0);
      
      const keyboard = starterCharacters.map(char => [
        { text: `${char.emoji} ${char.name}`, callback_data: `char_${char.id}` }
      ]);

      await ctx.reply(
        ctx.i18n!.t('choose_character'),
        {
          reply_markup: {
            inline_keyboard: keyboard
          }
        }
      );
      return;
    }

    // Show main menu
    const referralCount = await referralService.getUserReferralCount(telegramId, 1);
    const rank = await leaderboardService.getUserRank(telegramId);

    await ctx.reply(
      ctx.i18n!.t('main_menu', {
        balance: user.links_balance,
        count: referralCount,
        rank: rank
      }),
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔗 Invite friend', callback_data: 'menu_invite' }],
            [{ text: '📊 My team', callback_data: 'menu_team' }],
            [{ text: '🏅 Top players', callback_data: 'menu_leaderboard' }],
            [{ text: '👤 Profile', callback_data: 'menu_profile' }]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Start command error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Try to send error message, fallback to English if i18n fails
    try {
      if (ctx.i18n) {
        await ctx.reply(ctx.i18n.t('error'));
      } else {
        await ctx.reply('⚠️ An error occurred. Please try again later.');
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
      // Last resort - try without i18n
      try {
        await ctx.reply('⚠️ An error occurred. Please try again later.');
      } catch (e) {
        console.error('Complete failure to send message:', e);
      }
    }
  }
}

