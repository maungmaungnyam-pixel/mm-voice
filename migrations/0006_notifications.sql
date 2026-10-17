CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('breaking', 'weather')),
  created_at TEXT NOT NULL,
  UNIQUE(post_id, kind)
);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON notifications(created_at DESC);
