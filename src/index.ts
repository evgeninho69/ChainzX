import bot from './bot';
import { query } from './database/connection';

async function main() {
  try {
    // Test database connection
    await query('SELECT NOW()');
    console.log('✓ Database connected');

    // Launch bot
    console.log('Launching bot...');
    await bot.launch();
    console.log('✓ Bot launched successfully');

    console.log('CHAINZ MVP is running!');
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Failed to start:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();

