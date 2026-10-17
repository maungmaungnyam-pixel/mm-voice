ALTER TABLE posts ADD COLUMN original_title TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN fingerprint TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS posts_news_source_url_unique_idx
  ON posts(source_url)
  WHERE type = 'news' AND source_url <> '';

CREATE INDEX IF NOT EXISTS posts_news_fingerprint_created_idx
  ON posts(fingerprint, created_at DESC)
  WHERE type = 'news' AND fingerprint <> '';

CREATE TABLE IF NOT EXISTS news_sync_state (
  source_name TEXT PRIMARY KEY,
  feed_url TEXT NOT NULL DEFAULT '',
  last_checked_at TEXT NOT NULL DEFAULT '',
  last_success_at TEXT NOT NULL DEFAULT '',
  last_status TEXT NOT NULL DEFAULT 'pending',
  items_seen INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT ''
);
