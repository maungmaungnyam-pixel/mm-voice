ALTER TABLE posts ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0);

CREATE TABLE IF NOT EXISTS app_analytics_daily (
  day TEXT PRIMARY KEY,
  total_visits INTEGER NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  daily_active_users INTEGER NOT NULL DEFAULT 0 CHECK (daily_active_users >= 0)
);

CREATE TABLE IF NOT EXISTS external_post_views (
  post_key TEXT PRIMARY KEY NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  updated_at TEXT NOT NULL DEFAULT ''
);
