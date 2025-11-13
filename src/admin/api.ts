import express from 'express';
import { query } from '../database/connection';

const router = express.Router();

// Basic auth middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const auth = req.headers.authorization;
  const expectedAuth = `Basic ${Buffer.from(process.env.ADMIN_PASSWORD || 'admin').toString('base64')}`;

  if (auth === expectedAuth) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

router.use(authMiddleware);

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
        COALESCE(SUM(links_balance), 0) as total_links,
        (SELECT COUNT(*) FROM guilds) as total_guilds,
        (SELECT COUNT(*) FROM referrals WHERE level = 1) as total_referrals
      FROM users
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users?page=1&limit=50
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const users = await query(`
      SELECT 
        telegram_id, username, first_name, 
        links_balance, crowns_balance,
        created_at,
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = users.telegram_id AND level = 1) as referral_count
      FROM users 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json(users.rows);
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:telegram_id/add-balance
router.post('/users/:telegram_id/add-balance', async (req, res) => {
  try {
    const { telegram_id } = req.params;
    const { links, crowns, reason } = req.body;

    if (links) {
      await query(
        'UPDATE users SET links_balance = links_balance + $1 WHERE telegram_id = $2',
        [links, telegram_id]
      );
    }

    if (crowns) {
      await query(
        'UPDATE users SET crowns_balance = crowns_balance + $1 WHERE telegram_id = $2',
        [crowns, telegram_id]
      );
    }

    console.log(`Admin action: Added balance to ${telegram_id}:`, { links, crowns, reason });

    res.json({ success: true });
  } catch (error) {
    console.error('Add balance API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/broadcast
router.post('/broadcast', async (req, res) => {
  try {
    const { message, target_users } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // This would need bot instance - simplified for now
    res.json({ 
      success: true, 
      message: 'Broadcast feature needs bot instance integration',
      note: 'Implement bot.telegram.sendMessage in a loop with rate limiting'
    });
  } catch (error) {
    console.error('Broadcast API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

