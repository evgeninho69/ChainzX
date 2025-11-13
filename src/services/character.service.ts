import { query, getClient } from '../database/connection';
import { Character, UserCharacter } from '../types';
import { CHARACTERS, getCharacterById, CharacterWithEmoji } from '../data/characters';

export class CharacterService {
  async getUserCharacters(userId: number): Promise<number[]> {
    const result = await query(
      'SELECT character_id FROM user_characters WHERE user_id = $1',
      [userId]
    );

    return result.rows.map(row => Number(row.character_id));
  }

  async addCharacterToUser(userId: number, characterId: number): Promise<void> {
    await query(
      'INSERT INTO user_characters (user_id, character_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, characterId]
    );
  }

  async setUserCharacter(userId: number, characterId: number): Promise<void> {
    // First add to collection if not exists
    await this.addCharacterToUser(userId, characterId);

    // Set as active character
    await query(
      'UPDATE users SET character_id = $1 WHERE telegram_id = $2',
      [characterId, userId]
    );
  }

  getAllCharacters(): CharacterWithEmoji[] {
    return CHARACTERS;
  }

  async getUserActiveCharacter(userId: number): Promise<CharacterWithEmoji | null> {
    const result = await query(
      'SELECT character_id FROM users WHERE telegram_id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].character_id) {
      return null;
    }

    const characterId = Number(result.rows[0].character_id);
    return getCharacterById(characterId) || null;
  }

  async openGachaChest(userId: number): Promise<CharacterWithEmoji> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check balance
      const userResult = await client.query(
        'SELECT links_balance FROM users WHERE telegram_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const balance = Number(userResult.rows[0].links_balance);
      const chestCost = 10000;

      if (balance < chestCost) {
        throw new Error('Insufficient balance');
      }

      // Deduct LINKS
      await client.query(
        'UPDATE users SET links_balance = links_balance - $1 WHERE telegram_id = $2',
        [chestCost, userId]
      );

      // Gacha roll
      const roll = Math.random() * 100;
      let character: CharacterWithEmoji;

      if (roll < 70) {
        const commons = CHARACTERS.filter(c => c.rarity === 'common' && c.cost > 0);
        character = commons[Math.floor(Math.random() * commons.length)];
      } else if (roll < 90) {
        const rares = CHARACTERS.filter(c => c.rarity === 'rare');
        character = rares[Math.floor(Math.random() * rares.length)];
      } else if (roll < 98) {
        const epics = CHARACTERS.filter(c => c.rarity === 'epic');
        character = epics[Math.floor(Math.random() * epics.length)];
      } else {
        const legendaries = CHARACTERS.filter(c => c.rarity === 'legendary');
        character = legendaries[Math.floor(Math.random() * legendaries.length)];
      }

      // Add to collection
      await client.query(
        'INSERT INTO user_characters (user_id, character_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, character.id]
      );

      await client.query('COMMIT');
      return character;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getCharactersByRarity(rarity: Character['rarity']): CharacterWithEmoji[] {
    return CHARACTERS.filter(c => c.rarity === rarity);
  }
}

export const characterService = new CharacterService();

