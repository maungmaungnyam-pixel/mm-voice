CREATE TABLE IF NOT EXISTS news_ingestion_queue (
  queue_key TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('myanmar', 'global')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  hosts_json TEXT NOT NULL DEFAULT '[]',
  fingerprint TEXT NOT NULL,
  queued_at TEXT NOT NULL,
  available_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processed')),
  processed_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS news_ingestion_queue_available_idx
  ON news_ingestion_queue(status, available_at, queued_at);

CREATE INDEX IF NOT EXISTS news_ingestion_queue_source_idx
  ON news_ingestion_queue(region, source_name, status, queued_at);
