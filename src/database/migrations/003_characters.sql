-- Migration 003: Characters system
-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  bonus INT NOT NULL,
  cost INT NOT NULL DEFAULT 0,
  UNIQUE(id)
);

-- User characters (collection)
CREATE TABLE IF NOT EXISTS user_characters (
  user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  character_id INT REFERENCES characters(id),
  obtained_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, character_id)
);

-- Insert default characters
INSERT INTO characters (id, name, rarity, bonus, cost) VALUES
  (1, 'Forest Fox', 'common', 5, 0),
  (2, 'Cloud Dreamer', 'common', 5, 10000),
  (3, 'Neon Knight', 'common', 5, 10000),
  (4, 'Spark Bot', 'common', 5, 10000),
  (5, 'Cyber Dragon', 'rare', 10, 50000),
  (6, 'Lunar Witch', 'rare', 10, 50000),
  (7, 'Chrono Samurai', 'rare', 10, 50000),
  (8, 'Prism Phoenix', 'rare', 10, 50000),
  (9, 'Void Reaper', 'epic', 25, 150000),
  (10, 'Aether Queen', 'epic', 25, 150000),
  (11, 'Genesis Titan', 'legendary', 50, 500000),
  (12, 'Omni Nexus', 'legendary', 50, 500000)
ON CONFLICT (id) DO UPDATE SET bonus = EXCLUDED.bonus, cost = EXCLUDED.cost;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_characters_user ON user_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_rarity ON characters(rarity);

