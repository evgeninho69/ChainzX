import { Character } from '../types';

export interface CharacterWithEmoji extends Character {
  emoji: string;
}

export const RARITY_ICONS: Record<string, string> = {
  common: '⚪',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟡'
};

export const CHARACTERS: CharacterWithEmoji[] = [
  { id: 1, name: 'Forest Fox', emoji: '🦊', rarity: 'common', bonus: 5, cost: 0 },
  { id: 2, name: 'Cloud Dreamer', emoji: '☁️', rarity: 'common', bonus: 5, cost: 10000 },
  { id: 3, name: 'Neon Knight', emoji: '⚔️', rarity: 'common', bonus: 5, cost: 10000 },
  { id: 4, name: 'Spark Bot', emoji: '🤖', rarity: 'common', bonus: 5, cost: 10000 },
  { id: 5, name: 'Cyber Dragon', emoji: '🐉', rarity: 'rare', bonus: 10, cost: 50000 },
  { id: 6, name: 'Lunar Witch', emoji: '🌙', rarity: 'rare', bonus: 10, cost: 50000 },
  { id: 7, name: 'Chrono Samurai', emoji: '⚡', rarity: 'rare', bonus: 10, cost: 50000 },
  { id: 8, name: 'Prism Phoenix', emoji: '🦜', rarity: 'rare', bonus: 10, cost: 50000 },
  { id: 9, name: 'Void Reaper', emoji: '💀', rarity: 'epic', bonus: 25, cost: 150000 },
  { id: 10, name: 'Aether Queen', emoji: '👑', rarity: 'epic', bonus: 25, cost: 150000 },
  { id: 11, name: 'Genesis Titan', emoji: '🌟', rarity: 'legendary', bonus: 50, cost: 500000 },
  { id: 12, name: 'Omni Nexus', emoji: '⚛️', rarity: 'legendary', bonus: 50, cost: 500000 },
];

export function getCharacterById(id: number): CharacterWithEmoji | undefined {
  return CHARACTERS.find(c => c.id === id);
}

export function getCharactersByRarity(rarity: Character['rarity']): CharacterWithEmoji[] {
  return CHARACTERS.filter(c => c.rarity === rarity);
}

export function buildProgressBar(current: number, total: number, length: number = 10): string {
  const filled = Math.floor((current / total) * length);
  const empty = length - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

