CREATE TABLE IF NOT EXISTS analytics_visitors (
  visitor_hash TEXT PRIMARY KEY NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  total_visits INTEGER NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  active_days INTEGER NOT NULL DEFAULT 0 CHECK (active_days >= 0),
  post_views INTEGER NOT NULL DEFAULT 0 CHECK (post_views >= 0),
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
  comments INTEGER NOT NULL DEFAULT 0 CHECK (comments >= 0)
);
CREATE INDEX IF NOT EXISTS analytics_visitors_last_seen_idx ON analytics_visitors(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS analytics_visitors_engagement_idx ON analytics_visitors(active_days DESC, total_visits DESC, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS analytics_visitor_days (
  visitor_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  visits INTEGER NOT NULL DEFAULT 0 CHECK (visits >= 0),
  post_views INTEGER NOT NULL DEFAULT 0 CHECK (post_views >= 0),
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
  comments INTEGER NOT NULL DEFAULT 0 CHECK (comments >= 0),
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (visitor_hash, day)
);
CREATE INDEX IF NOT EXISTS analytics_visitor_days_day_idx ON analytics_visitor_days(day, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS admin_post_suppressions (
  source_url TEXT PRIMARY KEY NOT NULL,
  deleted_at TEXT NOT NULL
);
