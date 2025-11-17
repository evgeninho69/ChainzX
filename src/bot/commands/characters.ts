import { Context } from 'telegraf';
import { characterService } from '../../services/character.service';
import { CHARACTERS, RARITY_ICONS, buildProgressBar } from '../../data/characters';
import { userService } from '../../services/user.service';

const ACHIEVEMENTS = {
  collector_starter: {
    name: '🎖️ Начинающий коллекционер',
    condition: (owned: number[]) => owned.length >= 5,
    reward: 5000
  },
  rarity_hunter: {
    name: '🏆 Охотник за редкостью',
    condition: (owned: number[]) => {
      const ownedChars = CHARACTERS.filter(c => owned.includes(c.id));
      return ownedChars.filter(c => c.rarity === 'rare').length >= 2;
    },
    reward: 10000
  },
  legend_owner: {
    name: '👑 Владелец легенды',
    condition: (owned: number[]) => {
      const ownedChars = CHARACTERS.filter(c => owned.includes(c.id));
      return ownedChars.filter(c => c.rarity === 'legendary').length >= 1;
    },
    reward: 50000
  }
};

export async function handleCharacters(ctx: Context) {
  try {
    const userId = ctx.from!.id;
    const user = await userService.getUser(userId);
    const userCharacters = await characterService.getUserCharacters(userId);
    const activeCharacter = await characterService.getUserActiveCharacter(userId);

    let message = `👤 ${ctx.i18n!.t('characters_title')}\n\n`;

    // Active character with box
    if (activeCharacter) {
      const char = CHARACTERS.find(c => c.id === activeCharacter.id);
      if (char) {
        message += `╔═══════════════════════════╗\n`;
        message += `║   ${char.emoji} ${char.name.padEnd(20)}║\n`;
        message += `║   ─────────────────────   ║\n`;
        message += `║   Редкость: ${RARITY_ICONS[char.rarity]} ${char.rarity.charAt(0).toUpperCase() + char.rarity.slice(1).padEnd(15)}║\n`;
        message += `║   Бонус: +${char.bonus}% LINKS${' '.repeat(12)}║\n`;
        message += `╚═══════════════════════════╝\n\n`;
      }
    }

    message += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📦 ${ctx.i18n!.t('characters_collection')}\n\n`;

    // Common characters
    const commons = CHARACTERS.filter(c => c.rarity === 'common');
    const ownedCommons = commons.filter(c => userCharacters.includes(c.id));
    const commonProgress = buildProgressBar(ownedCommons.length, commons.length);
    const commonPercent = Math.floor((ownedCommons.length / commons.length) * 100);
    
    message += `${RARITY_ICONS.common} Common (${ownedCommons.length}/${commons.length}):\n`;
    message += `${commonProgress} ${commonPercent}%\n`;
    commons.forEach(char => {
      const owned = userCharacters.includes(char.id);
      const status = owned ? '✅' : '🔒';
      const cost = char.cost > 0 ? ` — ${char.cost.toLocaleString()} LINKS` : '';
      message += `${status} ${char.emoji} ${char.name}${cost}\n`;
    });

    // Rare characters
    const rares = CHARACTERS.filter(c => c.rarity === 'rare');
    const ownedRares = rares.filter(c => userCharacters.includes(c.id));
    const rareProgress = buildProgressBar(ownedRares.length, rares.length);
    const rarePercent = Math.floor((ownedRares.length / rares.length) * 100);
    
    message += `\n${RARITY_ICONS.rare} Rare (${ownedRares.length}/${rares.length}):\n`;
    message += `${rareProgress} ${rarePercent}%\n`;
    rares.forEach(char => {
      const owned = userCharacters.includes(char.id);
      const status = owned ? '✅' : '🔒';
      message += `${status} ${char.emoji} ${char.name} — ${char.cost.toLocaleString()} LINKS\n`;
    });

    // Epic characters
    const epics = CHARACTERS.filter(c => c.rarity === 'epic');
    const ownedEpics = epics.filter(c => userCharacters.includes(c.id));
    const epicProgress = buildProgressBar(ownedEpics.length, epics.length);
    const epicPercent = Math.floor((ownedEpics.length / epics.length) * 100);
    
    message += `\n${RARITY_ICONS.epic} Epic (${ownedEpics.length}/${epics.length}):\n`;
    message += `${epicProgress} ${epicPercent}%\n`;
    epics.forEach(char => {
      const owned = userCharacters.includes(char.id);
      const status = owned ? '✅' : '🔒';
      message += `${status} ${char.emoji} ${char.name} — ${char.cost.toLocaleString()} LINKS\n`;
    });

    // Legendary characters
    const legendaries = CHARACTERS.filter(c => c.rarity === 'legendary');
    const ownedLegendaries = legendaries.filter(c => userCharacters.includes(c.id));
    const legendaryProgress = buildProgressBar(ownedLegendaries.length, legendaries.length);
    const legendaryPercent = Math.floor((ownedLegendaries.length / legendaries.length) * 100);
    
    message += `\n${RARITY_ICONS.legendary} Legendary (${ownedLegendaries.length}/${legendaries.length}):\n`;
    message += `${legendaryProgress} ${legendaryPercent}%\n`;
    legendaries.forEach(char => {
      const owned = userCharacters.includes(char.id);
      const status = owned ? '✅' : '🔒';
      message += `${status} ${char.emoji} ${char.name} — ${char.cost.toLocaleString()} LINKS\n`;
    });

    // Achievements
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🎖️ ДОСТИЖЕНИЯ:\n\n`;

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      const unlocked = achievement.condition(userCharacters);
      const icon = unlocked ? '✅' : '🔒';
      message += `${icon} ${achievement.name}\n`;
      if (!unlocked) {
        message += `   Награда: ${achievement.reward.toLocaleString()} LINKS\n`;
      }
    }

    message += `\n💡 Подсказка: Открой сундук в /shop чтобы получить новых персонажей!`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎁 Открыть сундук', callback_data: 'open_chest' },
            { text: '🔄 Сменить персонажа', callback_data: 'change_character' }
          ],
          [{ text: '🏪 Магазин', callback_data: 'menu_shop' }]
        ]
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Characters command error:', error);
    await ctx.reply(ctx.i18n!.t('error'));
  }
}
