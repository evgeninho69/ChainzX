import { Context } from 'telegraf';
import { characterService } from '../../services/character.service';
import { userService } from '../../services/user.service';
import { guildService } from '../../services/guild.service';
import { referralService } from '../../services/referral.service';
import { leaderboardService } from '../../services/leaderboard.service';
import { handleInvite } from '../commands/invite';
import { handleTeam } from '../commands/team';
import { handleLeaderboard } from '../commands/leaderboard';
import { handleGuilds } from '../commands/guilds';
import { handleCharacters } from '../commands/characters';
import { handleShop } from '../commands/shop';
import { handleStart } from '../commands/start';

export async function handleCallbacks(ctx: Context) {
  const callbackData = ctx.callbackQuery && 'data' in ctx.callbackQuery 
    ? ctx.callbackQuery.data 
    : null;

  if (!callbackData) return;

  try {
    await ctx.answerCbQuery();

    // Character selection
    if (callbackData.startsWith('char_')) {
      const characterId = parseInt(callbackData.split('_')[1]);
      await characterService.setUserCharacter(ctx.from!.id, characterId);
      
      const character = characterService.getAllCharacters().find(c => c.id === characterId);
      if (character) {
        await ctx.editMessageText(
          ctx.i18n.t('character_selected', {
            name: character.name,
            bonus: character.bonus
          })
        );
        
        // Show main menu after character selection
        await handleStart(ctx);
      }
      return;
    }

    // Language selection
    if (callbackData.startsWith('lang_')) {
      const lang = callbackData.split('_')[1];
      await userService.setLanguage(ctx.from!.id, lang);
      
      // Update i18n context
      ctx.i18n!.locale = lang;
      
      await ctx.editMessageText(ctx.i18n.t('language_changed'));
      
      // After language selection, show character selection if needed
      const user = await userService.getUser(ctx.from!.id);
      if (user && !user.character_id) {
        const { CHARACTERS } = await import('../../data/characters');
        const starterCharacters = CHARACTERS.filter(c => c.cost === 0);
        
        const keyboard = starterCharacters.map(char => [
          { text: `${char.emoji} ${char.name}`, callback_data: `char_${char.id}` }
        ]);

        await ctx.reply(
          ctx.i18n.t('choose_character'),
          {
            reply_markup: {
              inline_keyboard: keyboard
            }
          }
        );
      } else {
        // Show main menu
        await handleStart(ctx);
      }
      return;
    }

    // Menu callbacks
    if (callbackData === 'menu_invite') {
      await handleInvite(ctx);
      return;
    }

    if (callbackData === 'menu_team') {
      await handleTeam(ctx);
      return;
    }

    if (callbackData === 'menu_leaderboard') {
      await handleLeaderboard(ctx);
      return;
    }

    if (callbackData === 'menu_profile' || callbackData === 'menu_characters') {
      await handleCharacters(ctx);
      return;
    }

    if (callbackData === 'menu_shop') {
      await handleShop(ctx);
      return;
    }

    // Guild callbacks
    if (callbackData === 'guild_create') {
      ctx.session.awaitingGuildName = true;
      await ctx.reply(ctx.i18n.t('guild_create_prompt'));
      return;
    }

    if (callbackData === 'guild_browse') {
      const allGuilds = await guildService.getAllGuilds();
      let message = `${ctx.i18n.t('guilds_title')}\n\n`;
      
      allGuilds.slice(0, 20).forEach((guild, idx) => {
        message += `${idx + 1}. ${guild.name} — ${guild.total_links.toLocaleString()} LINKS (${guild.member_count} players)\n`;
      });

      const keyboard = allGuilds.slice(0, 10).map(guild => [
        { text: guild.name, callback_data: `guild_join_${guild.id}` }
      ]);

      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      return;
    }

    if (callbackData.startsWith('guild_join_')) {
      const guildId = parseInt(callbackData.split('_')[2]);
      const allGuilds = await guildService.getAllGuilds();
      const guild = allGuilds.find(g => g.id === guildId);
      await guildService.joinGuild(ctx.from!.id, guildId);
      await ctx.reply(ctx.i18n.t('guild_created', { name: guild?.name || 'Team' }));
      return;
    }

    if (callbackData === 'guild_leave') {
      await guildService.leaveGuild(ctx.from!.id);
      await ctx.reply('✅ Left the team');
      return;
    }

    // Copy link callback
    if (callbackData.startsWith('copy_link:')) {
      const userId = callbackData.split(':')[1];
      const botUsername = ctx.botInfo?.username || 'ChainzX_bot';
      const inviteLink = `https://t.me/${botUsername}?start=${userId}`;
      
      await ctx.answerCbQuery(
        '✅ Ссылка скопирована в буфер обмена!',
        { show_alert: false }
      );
      
      await ctx.reply(
        `🔗 Твоя ссылка:\n${inviteLink}\n\n` +
        `Нажми и удержи чтобы скопировать ☝️`,
        { disable_web_page_preview: true }
      );
      return;
    }

    // Change character callback
    if (callbackData === 'change_character') {
      const userId = ctx.from!.id;
      const userCharacters = await characterService.getUserCharacters(userId);
      
      if (userCharacters.length === 0) {
        await ctx.answerCbQuery('У тебя пока нет персонажей! Открой сундук в /shop', { show_alert: true });
        return;
      }

      const keyboard = userCharacters.map(charId => {
        const char = characterService.getAllCharacters().find(c => c.id === charId);
        if (!char) return null;
        return [{ text: `${char.emoji} ${char.name}`, callback_data: `set_char_${char.id}` }];
      }).filter(Boolean);

      await ctx.reply(
        '🔄 Выбери персонажа для активации:',
        {
          reply_markup: {
            inline_keyboard: keyboard as any
          }
        }
      );
      return;
    }

    // Set character callback
    if (callbackData.startsWith('set_char_')) {
      const characterId = parseInt(callbackData.split('_')[2]);
      await characterService.setUserCharacter(ctx.from!.id, characterId);
      const char = characterService.getAllCharacters().find(c => c.id === characterId);
      
      await ctx.answerCbQuery(`✅ Персонаж ${char?.name} активирован!`, { show_alert: true });
      await ctx.editMessageText('✅ Персонаж изменён!');
      return;
    }

    // Shop callbacks
    if (callbackData === 'open_chest' || callbackData === 'shop_open_chest') {
      const userId = ctx.from!.id;
      const { userService } = await import('../../services/user.service');
      
      try {
        const user = await userService.getUser(userId);
        if (!user) {
          await ctx.answerCbQuery(ctx.i18n.t('error'), { show_alert: true });
          return;
        }

        // Check balance before animation
        const chestCost = 10000;
        if (user.links_balance < chestCost) {
          await ctx.answerCbQuery(
            ctx.i18n.t('shop_insufficient') || `❌ Недостаточно LINKS! Нужно ${chestCost.toLocaleString()} LINKS`,
            { show_alert: true }
          );
          
          // Restore shop message
          const shopText = `${ctx.i18n.t('shop_title')}\n\n` +
            `${ctx.i18n.t('shop_balance', { balance: user.links_balance.toLocaleString() })}\n\n` +
            `${ctx.i18n.t('shop_chest')}\n` +
            `${ctx.i18n.t('shop_chances')}`;
          
          await ctx.editMessageText(shopText, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎁 Открыть сундук (10,000 LINKS)', callback_data: 'open_chest' }]
              ]
            }
          });
          return;
        }

        // Animation
        await ctx.editMessageText('🎁 Открываем сундук...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await ctx.editMessageText('🎁 Открываем сундук... ✨');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await ctx.editMessageText('🎁 Открываем сундук... ✨✨');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const character = await characterService.openGachaChest(userId);
        const { RARITY_ICONS } = await import('../../data/characters');
        
        const rarityIcon = RARITY_ICONS[character.rarity] || '⚪';
        const rarityName = character.rarity.charAt(0).toUpperCase() + character.rarity.slice(1);
        const char = characterService.getAllCharacters().find(c => c.id === character.id);
        const emoji = char?.emoji || '🎁';
        
        // Get updated balance
        const updatedUser = await userService.getUser(userId);
        
        await ctx.editMessageText(
          `✨ ТЫ ПОЛУЧИЛ:\n\n` +
          `╔═══════════════════════════╗\n` +
          `║  ${emoji} ${character.name.padEnd(22)}║\n` +
          `║  Редкость: ${rarityIcon} ${rarityName.padEnd(18)}║\n` +
          `║  Бонус: +${character.bonus}% LINKS${' '.repeat(15)}║\n` +
          `╚═══════════════════════════╝\n\n` +
          `💰 Баланс: ${updatedUser?.links_balance.toLocaleString() || 0} LINKS\n\n` +
          `🎉 Поздравляем!`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎁 Открыть ещё', callback_data: 'open_chest' }],
                [{ text: '👤 Мои персонажи', callback_data: 'menu_profile' }]
              ]
            }
          }
        );
      } catch (error: any) {
        console.error('Open chest error:', error);
        
        if (error.message === 'Insufficient balance' || error.message?.includes('balance')) {
          await ctx.answerCbQuery(
            ctx.i18n.t('shop_insufficient') || `❌ Недостаточно LINKS! Нужно 10,000 LINKS`,
            { show_alert: true }
          );
          
          // Restore shop message
          try {
            const user = await userService.getUser(userId);
            if (user) {
              const shopText = `${ctx.i18n.t('shop_title')}\n\n` +
                `${ctx.i18n.t('shop_balance', { balance: user.links_balance.toLocaleString() })}\n\n` +
                `${ctx.i18n.t('shop_chest')}\n` +
                `${ctx.i18n.t('shop_chances')}`;
              
              await ctx.editMessageText(shopText, {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '🎁 Открыть сундук (10,000 LINKS)', callback_data: 'open_chest' }]
                  ]
                }
              });
            }
          } catch (restoreError) {
            console.error('Failed to restore shop message:', restoreError);
          }
        } else {
          await ctx.answerCbQuery(ctx.i18n.t('error'), { show_alert: true });
          throw error;
        }
      }
      return;
    }

  } catch (error) {
    console.error('Callback handler error:', error);
    await ctx.reply(ctx.i18n.t('error'));
  }
}

