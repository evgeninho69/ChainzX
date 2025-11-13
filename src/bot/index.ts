import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { sessionMiddleware } from './middleware/session';
import { loggerMiddleware } from './middleware/logger';
import { i18nMiddleware } from './middleware/i18n';
import { handleStart } from './commands/start';
import { handleHelp } from './commands/help';
import { handleBalance } from './commands/balance';
import { handleInvite } from './commands/invite';
import { handleTeam } from './commands/team';
import { handleLeaderboard } from './commands/leaderboard';
import { handleGuilds } from './commands/guilds';
import { handleCharacters } from './commands/characters';
import { handleShop } from './commands/shop';
import { handleRewards } from './commands/rewards';
import { handleLanguage } from './commands/language';
import { handleCallbacks } from './handlers/callbacks';
import { handleText } from './handlers/text';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is not set in .env file');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Add startup logging
bot.telegram.getMe().then((botInfo) => {
  console.log(`Bot @${botInfo.username} (${botInfo.first_name}) is ready`);
}).catch((err) => {
  console.error('Failed to get bot info:', err);
});

// Middleware
bot.use(sessionMiddleware());
bot.use(loggerMiddleware);
bot.use(i18nMiddleware);

// Commands
bot.command('start', async (ctx) => {
  console.log('START command handler called');
  await handleStart(ctx);
});
bot.command('help', handleHelp);
bot.command('balance', handleBalance);
bot.command('invite', handleInvite);
bot.command('team', handleTeam);
bot.command('leaderboard', handleLeaderboard);
bot.command('guilds', handleGuilds);
bot.command('characters', handleCharacters);
bot.command('shop', handleShop);
bot.command('rewards', handleRewards);
bot.command('language', handleLanguage);

// Callbacks
bot.on('callback_query', handleCallbacks);

// Text messages
bot.on('text', handleText);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  if (err instanceof Error) {
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
  }
  
  // Try to reply with error message
  ctx.reply(ctx.i18n?.t('error') || 'An error occurred').catch((replyErr) => {
    console.error('Failed to send error reply:', replyErr);
  });
});

export default bot;

