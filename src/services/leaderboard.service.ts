import { query } from '../database/connection';

export interface LeaderboardEntry {
  telegram_id: number;
  username: string | null;
  links_balance: number;
  referral_count: number;
}

export class LeaderboardService {
  async getTopUsers(limit: number = 100): Promise<LeaderboardEntry[]> {
    const result = await query(`
      SELECT 
        u.telegram_id,
        u.username,
        u.links_balance,
        (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = u.telegram_id AND r.level = 1) as referral_count
      FROM users u
      ORDER BY u.links_balance DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      telegram_id: Number(row.telegram_id),
      username: row.username,
      links_balance: Number(row.links_balance),
      referral_count: Number(row.referral_count),
    }));
  }

  async getUserRank(userId: number): Promise<number> {
    const result = await query(`
      SELECT COUNT(*) + 1 as rank
      FROM users
      WHERE links_balance > (SELECT links_balance FROM users WHERE telegram_id = $1)
    `, [userId]);

    return Number(result.rows[0].rank);
  }

  async getUserLinks(userId: number): Promise<number> {
    const result = await query(
      'SELECT links_balance FROM users WHERE telegram_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return 0;
    }

    return Number(result.rows[0].links_balance);
  }
}

export const leaderboardService = new LeaderboardService();

