CREATE TABLE IF NOT EXISTS news_sources (
  source_name TEXT PRIMARY KEY NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  hosts_json TEXT NOT NULL DEFAULT '[]',
  region TEXT NOT NULL DEFAULT 'myanmar' CHECK (region = 'myanmar'),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS news_sources_enabled_name_idx
  ON news_sources(region, enabled, source_name);

INSERT OR IGNORE INTO news_sources (source_name, feed_url, hosts_json, region, enabled, created_at, updated_at) VALUES
  ('BBC Burmese', 'https://feeds.bbci.co.uk/burmese/rss.xml', '["bbci.co.uk","bbc.co.uk","bbc.com"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('Radio Free Asia Burmese', 'https://www.rfa.org/burmese/rss2.xml', '["rfa.org"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('VOA Burmese', 'https://burmese.voanews.com/api/zb_u_l-vomx-tpeqrjy', '["voanews.com"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('Democratic Voice of Burma', 'https://english.dvb.no/feed/', '["dvb.no"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('Myanmar Now', 'https://myanmar-now.org/feed/', '["myanmar-now.org"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('The Irrawaddy Burmese', 'https://burma.irrawaddy.com/feed/', '["irrawaddy.com"]', 'myanmar', 1, datetime('now'), datetime('now'));
