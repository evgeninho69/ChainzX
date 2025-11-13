export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  language_code: string;
  referrer_id: number | null;
  links_balance: number;
  crowns_balance: number;
  character_id: number | null;
  guild_id: number | null;
  created_at: Date;
  last_active: Date;
}

export interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  level: number;
  links_earned: number;
  created_at: Date;
}

export interface Guild {
  id: number;
  name: string;
  creator_id: number;
  description: string | null;
  total_links: number;
  member_count: number;
  created_at: Date;
}

export interface UserCharacter {
  user_id: number;
  character_id: number;
  obtained_at: Date;
}

export interface Character {
  id: number;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  bonus: number;
  cost: number;
}

export interface ReferralTree {
  level1: Array<{
    telegram_id: number;
    username: string | null;
    links_balance: number;
    referral_count: number;
  }>;
  level2: Array<{
    telegram_id: number;
    username: string | null;
    links_balance: number;
  }>;
  level1Earnings: number;
  level2Earnings: number;
}

