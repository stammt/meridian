-- Users
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Worlds (persistent campaign universes)
CREATE TABLE IF NOT EXISTS worlds (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'New Campaign',
  world_state JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Magic link tokens (short-lived, single-use)
CREATE TABLE IF NOT EXISTS magic_links (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Stories (a user can have many)
CREATE TABLE IF NOT EXISTS stories (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  world_id    INTEGER REFERENCES worlds(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'Untitled Mission',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete', 'failed', 'abandoned')),
  scenario    JSONB,
  ingredients JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: run these if upgrading an existing database
-- CREATE TABLE IF NOT EXISTS allowed_emails (email TEXT PRIMARY KEY);
-- CREATE TABLE IF NOT EXISTS worlds (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL DEFAULT 'New Campaign', world_state JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
-- ALTER TABLE stories ADD COLUMN IF NOT EXISTS world_id INTEGER REFERENCES worlds(id) ON DELETE SET NULL;
-- ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_status_check;
-- ALTER TABLE stories ADD CONSTRAINT stories_status_check CHECK (status IN ('active', 'complete', 'failed', 'abandoned'));
-- ALTER TABLE stories ADD COLUMN IF NOT EXISTS scenario JSONB;
-- ALTER TABLE stories ADD COLUMN IF NOT EXISTS ingredients JSONB;

-- Individual messages within a story (the full conversation history)
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  story_id    INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Closed beta allow-list (checked when CLOSED_BETA env var is not 'false')
CREATE TABLE IF NOT EXISTS allowed_emails (
  email       TEXT PRIMARY KEY
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_magic_links_token_hash ON magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_worlds_user_id         ON worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id        ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_world_id       ON stories(world_id);
CREATE INDEX IF NOT EXISTS idx_messages_story_id      ON messages(story_id);
