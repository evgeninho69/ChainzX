import { query, getClient } from '../database/connection';
import { ReferralTree } from '../types';

export class ReferralService {
  async processReferral(newUserId: number, referrerId: number | null): Promise<void> {
    if (!referrerId || referrerId === newUserId) {
      return; // Self-referral blocked
    }

    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Check if referral already exists
      const existing = await client.query(
        'SELECT id FROM referrals WHERE referrer_id = $1 AND referred_id = $2',
        [referrerId, newUserId]
      );

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return; // Already processed
      }

      // L1: Direct referral - add 1000 LINKS
      await client.query(
        'UPDATE users SET links_balance = links_balance + $1 WHERE telegram_id = $2',
        [1000, referrerId]
      );

      await client.query(
        'INSERT INTO referrals (referrer_id, referred_id, level, links_earned) VALUES ($1, $2, $3, $4)',
        [referrerId, newUserId, 1, 1000]
      );

      // L2: Find grand-referrer
      const referrerData = await client.query(
        'SELECT referrer_id FROM users WHERE telegram_id = $1',
        [referrerId]
      );

      if (referrerData.rows[0]?.referrer_id) {
        const grandReferrerId = referrerData.rows[0].referrer_id;
        
        if (grandReferrerId !== newUserId) {
          // Add 100 LINKS to grand-referrer
          await client.query(
            'UPDATE users SET links_balance = links_balance + $1 WHERE telegram_id = $2',
            [100, grandReferrerId]
          );

          await client.query(
            'INSERT INTO referrals (referrer_id, referred_id, level, links_earned) VALUES ($1, $2, $3, $4)',
            [grandReferrerId, newUserId, 2, 100]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getReferralTree(userId: number): Promise<ReferralTree> {
    // Level 1: Direct referrals
    const level1Result = await query(`
      SELECT 
        u.telegram_id,
        u.username,
        u.links_balance,
        (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = u.telegram_id AND r.level = 1) as referral_count
      FROM referrals r
      JOIN users u ON r.referred_id = u.telegram_id
      WHERE r.referrer_id = $1 AND r.level = 1
      ORDER BY u.links_balance DESC
    `, [userId]);

    // Level 2: Referrals of referrals
    const level2Result = await query(`
      SELECT 
        u.telegram_id,
        u.username,
        u.links_balance
      FROM referrals r
      JOIN users u ON r.referred_id = u.telegram_id
      WHERE r.referrer_id = $1 AND r.level = 2
      ORDER BY u.links_balance DESC
    `, [userId]);

    // Calculate earnings
    const level1EarningsResult = await query(`
      SELECT COALESCE(SUM(links_earned), 0) as total
      FROM referrals
      WHERE referrer_id = $1 AND level = 1
    `, [userId]);

    const level2EarningsResult = await query(`
      SELECT COALESCE(SUM(links_earned), 0) as total
      FROM referrals
      WHERE referrer_id = $1 AND level = 2
    `, [userId]);

    return {
      level1: level1Result.rows.map(row => ({
        telegram_id: Number(row.telegram_id),
        username: row.username,
        links_balance: Number(row.links_balance),
        referral_count: Number(row.referral_count),
      })),
      level2: level2Result.rows.map(row => ({
        telegram_id: Number(row.telegram_id),
        username: row.username,
        links_balance: Number(row.links_balance),
      })),
      level1Earnings: Number(level1EarningsResult.rows[0].total),
      level2Earnings: Number(level2EarningsResult.rows[0].total),
    };
  }

  async getUserReferralCount(userId: number, level: number): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1 AND level = $2',
      [userId, level]
    );
    return Number(result.rows[0].count);
  }
}

export const referralService = new ReferralService();

