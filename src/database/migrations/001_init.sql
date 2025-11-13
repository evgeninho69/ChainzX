-- Migration 001: Initial schema
-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'en',
  referrer_id BIGINT,
  links_balance INT DEFAULT 100,
  crowns_balance INT DEFAULT 0,
  character_id INT DEFAULT NULL,
  guild_id BIGINT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint for referrer_id (after table creation)
ALTER TABLE users 
ADD CONSTRAINT users_referrer_id_fkey 
FOREIGN KEY (referrer_id) REFERENCES users(telegram_id);

-- Referrals table
CREATE TABLE referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT NOT NULL,
  referred_id BIGINT NOT NULL,
  level INT NOT NULL CHECK (level IN (1, 2)),
  links_earned INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Add foreign keys for referrals
ALTER TABLE referrals 
ADD CONSTRAINT referrals_referrer_id_fkey 
FOREIGN KEY (referrer_id) REFERENCES users(telegram_id);

ALTER TABLE referrals 
ADD CONSTRAINT referrals_referred_id_fkey 
FOREIGN KEY (referred_id) REFERENCES users(telegram_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_links ON users(links_balance DESC);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

