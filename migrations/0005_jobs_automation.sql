ALTER TABLE posts ADD COLUMN company_name TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN job_requirements TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN contact_info TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN application_method TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN application_url TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN posted_at TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS posts_job_source_url_unique_idx
  ON posts(source_url)
  WHERE type = 'job' AND source_url <> '';
CREATE INDEX IF NOT EXISTS posts_job_fingerprint_created_idx
  ON posts(fingerprint, created_at DESC)
  WHERE type = 'job' AND fingerprint <> '';

CREATE TABLE IF NOT EXISTS job_sync_state (
  source_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL DEFAULT '',
  feed_url TEXT NOT NULL DEFAULT '',
  last_checked_at TEXT NOT NULL DEFAULT '',
  last_success_at TEXT NOT NULL DEFAULT '',
  last_status TEXT NOT NULL DEFAULT 'pending',
  items_seen INTEGER NOT NULL DEFAULT 0,
  items_inserted INTEGER NOT NULL DEFAULT 0,
  duplicates INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT ''
);
