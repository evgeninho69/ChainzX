// Production server entry point for Beget
// This file combines bot and admin server for production deployment

require('dotenv').config();
const express = require('express');
const path = require('path');

async function startServer() {
  try {
    // Test database connection
    const { query } = require('./dist/database/connection');
    await query('SELECT NOW()');
    console.log('✓ Database connected');

    // Import and launch bot
    console.log('Launching bot...');
    const bot = require('./dist/bot/index').default;
    await bot.launch();
    console.log('✓ Bot launched successfully');

    // Setup Express for admin panel
    const app = express();
    const PORT = process.env.PORT || process.env.ADMIN_PORT || 3000;

    app.use(express.json());

    // Import admin API
    const adminApi = require('./dist/admin/api').default;
    app.use('/api', adminApi);

    // Serve admin panel static files
    app.use('/admin', express.static(path.join(__dirname, 'dist/admin/public')));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Root endpoint
    app.get('/', (req, res) => {
      res.json({ 
        service: 'CHAINZ MVP',
        status: 'running',
        endpoints: {
          admin: '/admin',
          api: '/api',
          health: '/health'
        }
      });
    });

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✓ Admin panel running on port ${PORT}`);
      console.log('CHAINZ MVP is running!');
    });

    // Enable graceful stop
    process.once('SIGINT', () => {
      console.log('Shutting down gracefully...');
      bot.stop('SIGINT');
      process.exit(0);
    });
    
    process.once('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      bot.stop('SIGTERM');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

startServer();
