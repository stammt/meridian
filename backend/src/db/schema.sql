-- Users
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
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
  title       TEXT NOT NULL DEFAULT 'Untitled Mission',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete', 'failed')),
  scenario    JSONB,
  ingredients JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: run these if upgrading an existing database
-- ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete', 'failed'));
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_magic_links_token_hash ON magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_stories_user_id        ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_story_id      ON messages(story_id);
