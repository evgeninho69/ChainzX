import { query, getClient } from '../database/connection';
import { Guild } from '../types';

export class GuildService {
  async createGuild(name: string, creatorId: number): Promise<Guild> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if name exists
      const existing = await client.query(
        'SELECT id FROM guilds WHERE LOWER(name) = LOWER($1)',
        [name]
      );

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('Guild name already exists');
      }

      // Create guild
      const guildResult = await client.query(`
        INSERT INTO guilds (name, creator_id, description)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [name, creatorId, null]);

      const guild = guildResult.rows[0];

      // Add creator as member
      await client.query(
        'INSERT INTO guild_members (guild_id, user_id) VALUES ($1, $2)',
        [guild.id, creatorId]
      );

      // Update user's guild_id
      await client.query(
        'UPDATE users SET guild_id = $1 WHERE telegram_id = $2',
        [guild.id, creatorId]
      );

      // Update guild total_links
      await this.updateGuildTotalLinks(guild.id);

      await client.query('COMMIT');

      return {
        id: Number(guild.id),
        name: guild.name,
        creator_id: Number(guild.creator_id),
        description: guild.description,
        total_links: Number(guild.total_links),
        member_count: Number(guild.member_count),
        created_at: guild.created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async joinGuild(userId: number, guildId: number): Promise<void> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Leave current guild if any
      await this.leaveGuild(userId);

      // Join new guild
      await client.query(
        'INSERT INTO guild_members (guild_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [guildId, userId]
      );

      // Update user's guild_id
      await client.query(
        'UPDATE users SET guild_id = $1 WHERE telegram_id = $2',
        [guildId, userId]
      );

      // Update guild member count
      await client.query(`
        UPDATE guilds 
        SET member_count = (SELECT COUNT(*) FROM guild_members WHERE guild_id = $1)
        WHERE id = $1
      `, [guildId]);

      // Update guild total_links
      await this.updateGuildTotalLinks(guildId);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async leaveGuild(userId: number): Promise<void> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get current guild
      const userResult = await client.query(
        'SELECT guild_id FROM users WHERE telegram_id = $1',
        [userId]
      );

      const guildId = userResult.rows[0]?.guild_id;

      if (guildId) {
        // Remove from members
        await client.query(
          'DELETE FROM guild_members WHERE user_id = $1',
          [userId]
        );

        // Update user's guild_id
        await client.query(
          'UPDATE users SET guild_id = NULL WHERE telegram_id = $1',
          [userId]
        );

        // Update guild member count
        await client.query(`
          UPDATE guilds 
          SET member_count = (SELECT COUNT(*) FROM guild_members WHERE guild_id = $1)
          WHERE id = $1
        `, [guildId]);

        // Update guild total_links
        await this.updateGuildTotalLinks(guildId);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getTopGuilds(limit: number = 10): Promise<Guild[]> {
    const result = await query(`
      SELECT * FROM guilds
      ORDER BY total_links DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      id: Number(row.id),
      name: row.name,
      creator_id: Number(row.creator_id),
      description: row.description,
      total_links: Number(row.total_links),
      member_count: Number(row.member_count),
      created_at: row.created_at,
    }));
  }

  async getUserGuild(userId: number): Promise<Guild | null> {
    const result = await query(`
      SELECT g.* FROM guilds g
      JOIN users u ON u.guild_id = g.id
      WHERE u.telegram_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: Number(row.id),
      name: row.name,
      creator_id: Number(row.creator_id),
      description: row.description,
      total_links: Number(row.total_links),
      member_count: Number(row.member_count),
      created_at: row.created_at,
    };
  }

  async getAllGuilds(): Promise<Guild[]> {
    const result = await query(`
      SELECT * FROM guilds
      ORDER BY name ASC
    `);

    return result.rows.map(row => ({
      id: Number(row.id),
      name: row.name,
      creator_id: Number(row.creator_id),
      description: row.description,
      total_links: Number(row.total_links),
      member_count: Number(row.member_count),
      created_at: row.created_at,
    }));
  }

  private async updateGuildTotalLinks(guildId: number): Promise<void> {
    await query(`
      UPDATE guilds
      SET total_links = (
        SELECT COALESCE(SUM(links_balance), 0)
        FROM users
        WHERE guild_id = $1
      )
      WHERE id = $1
    `, [guildId]);
  }
}

export const guildService = new GuildService();

