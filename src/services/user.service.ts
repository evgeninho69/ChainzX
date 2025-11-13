import { query, getClient } from '../database/connection';
import { User } from '../types';

export class UserService {
  async getUser(telegramId: number): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: Number(row.id),
      telegram_id: Number(row.telegram_id),
      username: row.username,
      first_name: row.first_name,
      language_code: row.language_code || 'en',
      referrer_id: row.referrer_id ? Number(row.referrer_id) : null,
      links_balance: Number(row.links_balance),
      crowns_balance: Number(row.crowns_balance),
      character_id: row.character_id ? Number(row.character_id) : null,
      guild_id: row.guild_id ? Number(row.guild_id) : null,
      created_at: row.created_at,
      last_active: row.last_active,
    };
  }

  async createUser(data: {
    telegram_id: number;
    username?: string | null;
    first_name?: string | null;
    language_code?: string;
    referrer_id?: number | null;
  }): Promise<User> {
    const result = await query(`
      INSERT INTO users (telegram_id, username, first_name, language_code, referrer_id, links_balance)
      VALUES ($1, $2, $3, $4, $5, 100)
      RETURNING *
    `, [
      data.telegram_id,
      data.username || null,
      data.first_name || null,
      data.language_code || 'en',
      data.referrer_id || null,
    ]);

    const row = result.rows[0];
    return {
      id: Number(row.id),
      telegram_id: Number(row.telegram_id),
      username: row.username,
      first_name: row.first_name,
      language_code: row.language_code || 'en',
      referrer_id: row.referrer_id ? Number(row.referrer_id) : null,
      links_balance: Number(row.links_balance),
      crowns_balance: Number(row.crowns_balance),
      character_id: row.character_id ? Number(row.character_id) : null,
      guild_id: row.guild_id ? Number(row.guild_id) : null,
      created_at: row.created_at,
      last_active: row.last_active,
    };
  }

  async updateLastActive(telegramId: number): Promise<void> {
    await query(
      'UPDATE users SET last_active = NOW() WHERE telegram_id = $1',
      [telegramId]
    );
  }

  async setLanguage(telegramId: number, languageCode: string): Promise<void> {
    await query(
      'UPDATE users SET language_code = $1 WHERE telegram_id = $2',
      [languageCode, telegramId]
    );
  }

  async addLinks(telegramId: number, amount: number): Promise<void> {
    await query(
      'UPDATE users SET links_balance = links_balance + $1 WHERE telegram_id = $2',
      [amount, telegramId]
    );
  }

  async addCrowns(telegramId: number, amount: number): Promise<void> {
    await query(
      'UPDATE users SET crowns_balance = crowns_balance + $1 WHERE telegram_id = $2',
      [amount, telegramId]
    );
  }
}

export const userService = new UserService();

