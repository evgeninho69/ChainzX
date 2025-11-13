-- Migration 002: Guilds system
-- Guilds table
CREATE TABLE IF NOT EXISTS guilds (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  creator_id BIGINT NOT NULL REFERENCES users(telegram_id),
  description TEXT,
  total_links BIGINT DEFAULT 0,
  member_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guild members table
CREATE TABLE IF NOT EXISTS guild_members (
  guild_id BIGINT REFERENCES guilds(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (guild_id, user_id)
);

-- Add guild_id foreign key to users (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_guild_id_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_guild_id_fkey 
    FOREIGN KEY (guild_id) REFERENCES guilds(id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guilds_total_links ON guilds(total_links DESC);
CREATE INDEX IF NOT EXISTS idx_guild_members_user ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);

