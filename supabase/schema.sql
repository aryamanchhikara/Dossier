-- ─── USERS ───────────────────────────────────────────────────────
-- Mirrors NextAuth session users; stores profile data.
-- id is the Supabase-assigned UUID (set by our API on first sign-in).
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE,
  username      TEXT UNIQUE NOT NULL,
  name          TEXT,
  tagline       TEXT,
  pull_quote    TEXT,
  avatar_url    TEXT,
  tags          TEXT[]      DEFAULT '{}',
  password_hash TEXT,                         -- null for OAuth users
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TASTE ITEMS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taste_items (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT    NOT NULL,
  score      INTEGER NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CURRENTLY ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS currently_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category   TEXT NOT NULL CHECK (category IN ('reading', 'building', 'exploring')),
  text       TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category)
);

-- ─── WIDGETS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS widgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('github', 'instagram', 'spotify')),
  position     INTEGER NOT NULL DEFAULT 0,
  config       JSONB   NOT NULL DEFAULT '{}',
  access_token TEXT,                          -- AES-256-GCM encrypted
  connected_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, type)
);

-- ─── INDEXES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS taste_items_user_id_idx    ON taste_items    (user_id);
CREATE INDEX IF NOT EXISTS currently_items_user_id_idx ON currently_items (user_id);
CREATE INDEX IF NOT EXISTS widgets_user_id_idx        ON widgets        (user_id);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_currently_updated_at ON currently_items;
CREATE TRIGGER trg_currently_updated_at
  BEFORE UPDATE ON currently_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────────
-- Reads are public (profiles are public pages).
-- Writes go through our API using the service-role key (bypasses RLS).
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE taste_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE currently_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read users"           ON users           FOR SELECT USING (true);
CREATE POLICY "public read taste_items"     ON taste_items     FOR SELECT USING (true);
CREATE POLICY "public read currently_items" ON currently_items FOR SELECT USING (true);
-- Widgets: hide access_token from public reads by only exposing safe columns via a view (optional).
CREATE POLICY "public read widgets"         ON widgets         FOR SELECT USING (true);
