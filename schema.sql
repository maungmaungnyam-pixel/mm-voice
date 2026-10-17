PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('news', 'job')),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  original_body TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  salary TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  line_id TEXT NOT NULL DEFAULT '',
  is_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0, 1)),
  verified_by TEXT NOT NULL DEFAULT '',
  verified_at TEXT NOT NULL DEFAULT '',
  is_scam_alert INTEGER NOT NULL DEFAULT 0 CHECK (is_scam_alert IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT '',
  original_title TEXT NOT NULL DEFAULT '',
  fingerprint TEXT NOT NULL DEFAULT '',
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  company_name TEXT NOT NULL DEFAULT '',
  job_requirements TEXT NOT NULL DEFAULT '',
  contact_info TEXT NOT NULL DEFAULT '',
  application_method TEXT NOT NULL DEFAULT '',
  application_url TEXT NOT NULL DEFAULT '',
  posted_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS posts_type_created_at_idx ON posts(type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS posts_news_source_url_unique_idx
  ON posts(source_url)
  WHERE type = 'news' AND source_url <> '';
CREATE INDEX IF NOT EXISTS posts_news_fingerprint_created_idx
  ON posts(fingerprint, created_at DESC)
  WHERE type = 'news' AND fingerprint <> '';
CREATE UNIQUE INDEX IF NOT EXISTS posts_job_source_url_unique_idx
  ON posts(source_url)
  WHERE type = 'job' AND source_url <> '';
CREATE INDEX IF NOT EXISTS posts_job_fingerprint_created_idx
  ON posts(fingerprint, created_at DESC)
  WHERE type = 'job' AND fingerprint <> '';

CREATE TABLE IF NOT EXISTS news_sync_state (
  source_name TEXT PRIMARY KEY,
  feed_url TEXT NOT NULL DEFAULT '',
  last_checked_at TEXT NOT NULL DEFAULT '',
  last_success_at TEXT NOT NULL DEFAULT '',
  last_status TEXT NOT NULL DEFAULT 'pending',
  items_seen INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS news_sources (
  source_name TEXT PRIMARY KEY NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  hosts_json TEXT NOT NULL DEFAULT '[]',
  region TEXT NOT NULL DEFAULT 'myanmar' CHECK (region IN ('myanmar', 'global')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  official_website TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS news_sources_enabled_name_idx ON news_sources(region, enabled, source_name);
INSERT OR IGNORE INTO news_sources (source_name, feed_url, hosts_json, region, enabled, created_at, updated_at) VALUES
  ('BBC Burmese', 'https://feeds.bbci.co.uk/burmese/rss.xml', '["bbci.co.uk","bbc.co.uk","bbc.com"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('Radio Free Asia Burmese', 'https://www.rfa.org/burmese/rss2.xml', '["rfa.org"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('VOA Burmese', 'https://burmese.voanews.com/api/zb_u_l-vomx-tpeqrjy', '["voanews.com"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('Democratic Voice of Burma', 'https://english.dvb.no/feed/', '["dvb.no"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('Myanmar Now', 'https://myanmar-now.org/feed/', '["myanmar-now.org"]', 'myanmar', 1, datetime('now'), datetime('now')),
  ('The Irrawaddy Burmese', 'https://burma.irrawaddy.com/feed/', '["irrawaddy.com"]', 'myanmar', 1, datetime('now'), datetime('now'));

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

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_key TEXT NOT NULL,
  author TEXT NOT NULL,
  user_id TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS comments_post_created_at_idx ON comments(post_key, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_user_created_at_idx ON comments(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS likes (
  post_key TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_key, visitor_id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_identities (
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'line')),
  provider_subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_email TEXT NOT NULL DEFAULT '',
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (provider, provider_subject)
);
CREATE INDEX IF NOT EXISTS auth_identities_user_idx ON auth_identities(user_id, provider);

CREATE TABLE IF NOT EXISTS password_credentials (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified_at TEXT,
  password_updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_expiry_idx ON auth_sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS auth_email_tokens (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'password_reset')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX IF NOT EXISTS auth_email_tokens_user_expiry_idx ON auth_email_tokens(user_id, expires_at);

CREATE TABLE IF NOT EXISTS auth_oauth_states (
  state_hash TEXT PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'line')),
  nonce TEXT NOT NULL,
  code_verifier TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_oauth_states_expiry_idx ON auth_oauth_states(expires_at);

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

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('breaking', 'weather')),
  created_at TEXT NOT NULL,
  UNIQUE(post_id, kind)
);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Global publisher directory seeds mirror migrations/0010_global_publishers.sql.
UPDATE news_sources SET
  official_website = CASE source_name
    WHEN 'BBC Burmese' THEN 'https://www.bbc.com/burmese'
    WHEN 'Democratic Voice of Burma' THEN 'https://english.dvb.no'
    WHEN 'Independent Mon News Agency - IMNA (မွန်သတင်းအေဂျင်စီ)' THEN 'https://monnews.org'
    WHEN 'Kachin News Group - KNG (ကချင်သတင်းဌာန)' THEN 'https://kachinnews.com'
    WHEN 'Kantarawaddy Times (ကန္တာရဝတီတိုင်း(မ်) - ကယား)' THEN 'https://www.ktimes.org'
    WHEN 'Karen Information Center - KIC (ကရင်သတင်းဌာန)' THEN 'https://kicnews.org'
    WHEN 'Khit Thit' THEN 'https://yktnews.com'
    WHEN 'MPA' THEN 'https://mpanews.info'
    WHEN 'Mekong News' THEN 'https://mekongnewsmm.com'
    WHEN 'Myaelatt Athan (မြေလတ်အသံ)' THEN 'https://myaelattathan.com'
    WHEN 'Myanmar Now' THEN 'https://myanmar-now.org'
    WHEN 'Narinjara News (နိရဉ္စရာ သတင်းဌာန - ရခိုင်)' THEN 'https://www.narinjara.com'
    WHEN 'Radio Free Asia Burmese' THEN 'https://www.rfa.org/burmese'
    WHEN 'Shan Herald Agency for News - SHAN (ရှမ်းသတင်းဌာန)' THEN 'https://english.shannews.org'
    WHEN 'Tachileik News Agency (တာချီလိတ်သတင်းအေဂျင်စီ)' THEN 'https://www.tachileik.net'
    WHEN 'Than Lwin Times' THEN 'https://thanlwintimes.com'
    WHEN 'The Irrawaddy Burmese' THEN 'https://burma.irrawaddy.com'
    WHEN 'VOA Burmese' THEN 'https://burmese.voanews.com'
    ELSE official_website END,
  facebook_url = CASE source_name
    WHEN 'BBC Burmese' THEN 'https://www.facebook.com/BBCnewsBurmese/'
    WHEN 'Democratic Voice of Burma' THEN 'https://www.facebook.com/DVBEnglish/'
    WHEN 'Independent Mon News Agency - IMNA (မွန်သတင်းအေဂျင်စီ)' THEN 'https://www.facebook.com/monnews.org/'
    WHEN 'Kachin News Group - KNG (ကချင်သတင်းဌာန)' THEN 'https://www.facebook.com/KachinNewsGroup/'
    WHEN 'Kantarawaddy Times (ကန္တာရဝတီတိုင်း(မ်) - ကယား)' THEN 'https://www.facebook.com/KantarawaddyTimes/'
    WHEN 'Karen Information Center - KIC (ကရင်သတင်းဌာန)' THEN 'https://www.facebook.com/KICNewsOrg/'
    WHEN 'Khit Thit' THEN 'https://www.facebook.com/yktnews/'
    WHEN 'MPA' THEN 'https://www.facebook.com/mmpressphoto/'
    WHEN 'Mekong News' THEN 'https://www.facebook.com/mekongnewsmm/'
    WHEN 'Myaelatt Athan (မြေလတ်အသံ)' THEN 'https://www.facebook.com/MyaelattAthan/'
    WHEN 'Myanmar Now' THEN 'https://www.facebook.com/MyanmarNowEnglish/'
    WHEN 'Narinjara News (နိရဉ္စရာ သတင်းဌာန - ရခိုင်)' THEN 'https://www.facebook.com/Narinjaraenglish/'
    WHEN 'Radio Free Asia Burmese' THEN 'https://www.facebook.com/rfaburmese/'
    WHEN 'Shan Herald Agency for News - SHAN (ရှမ်းသတင်းဌာန)' THEN 'https://www.facebook.com/shannews/'
    WHEN 'Tachileik News Agency (တာချီလိတ်သတင်းအေဂျင်စီ)' THEN 'https://www.facebook.com/TachileikNewsAgency/'
    WHEN 'Than Lwin Times' THEN 'https://www.facebook.com/tltenglishedition/'
    WHEN 'The Irrawaddy Burmese' THEN 'https://www.facebook.com/theirrawaddyburmese/'
    WHEN 'VOA Burmese' THEN 'https://www.facebook.com/VOABurmese/'
    ELSE facebook_url END
WHERE region = 'myanmar';

INSERT OR IGNORE INTO news_sources
  (source_name, feed_url, hosts_json, region, enabled, created_at, updated_at, official_website, facebook_url)
VALUES
  ('BBC World', 'https://feeds.bbci.co.uk/news/world/rss.xml', '["bbci.co.uk","bbc.co.uk","bbc.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.bbc.com/news/world', 'https://www.facebook.com/bbcnews/'),
  ('TIME', 'https://time.com/feed/', '["time.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://time.com', 'https://www.facebook.com/TIMEMagazine/'),
  ('Al Jazeera English', 'https://www.aljazeera.com/xml/rss/all.xml', '["aljazeera.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.aljazeera.com', 'https://www.facebook.com/aljazeera/'),
  ('The Guardian', 'https://www.theguardian.com/world/rss', '["theguardian.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.theguardian.com/world', 'https://www.facebook.com/theguardian/'),
  ('France 24', 'https://www.france24.com/en/rss', '["france24.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.france24.com/en', 'https://www.facebook.com/FRANCE24.English/'),
  ('DW News', 'https://rss.dw.com/rdf/rss-en-all', '["dw.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.dw.com/en', 'https://www.facebook.com/deutschewellenews/'),
  ('NPR', 'https://feeds.npr.org/1004/rss.xml', '["npr.org"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.npr.org', 'https://www.facebook.com/NPR/'),
  ('CBC News', 'https://www.cbc.ca/webfeed/rss/rss-world', '["cbc.ca"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.cbc.ca', 'https://www.facebook.com/cbc/'),
  ('Sky News', 'https://feeds.skynews.com/feeds/rss/world.xml', '["sky.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://news.sky.com/world', 'https://www.facebook.com/skynews/'),
  ('ABC News Australia', 'https://www.abc.net.au/news/feed/45910/rss.xml', '["abc.net.au"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.abc.net.au/news', 'https://www.facebook.com/abc/'),
  ('The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', '["nytimes.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.nytimes.com/section/world', 'https://www.facebook.com/nytimes/'),
  ('CBS News', 'https://www.cbsnews.com/latest/rss/world', '["cbsnews.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.cbsnews.com', 'https://www.facebook.com/CBSNews/'),
  ('NBC News', 'https://feeds.nbcnews.com/nbcnews/public/world', '["nbcnews.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.nbcnews.com', 'https://www.facebook.com/NBCNews/'),
  ('The Japan Times', 'https://www.japantimes.co.jp/feed/topstories/', '["japantimes.co.jp"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.japantimes.co.jp', 'https://www.facebook.com/japantimes/'),
  ('South China Morning Post', 'https://www.scmp.com/rss/91/feed/', '["scmp.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.scmp.com', 'https://www.facebook.com/SCMP/'),
  ('Channel NewsAsia', 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511', '["channelnewsasia.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.channelnewsasia.com', 'https://www.facebook.com/ChannelNewsAsia/'),
  ('Euronews', 'https://www.euronews.com/rss', '["euronews.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.euronews.com', 'https://www.facebook.com/euronews/'),
  ('The Conversation', 'https://theconversation.com/global/articles.atom', '["theconversation.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://theconversation.com', 'https://www.facebook.com/theconversation/'),
  ('Anadolu Agency', 'https://www.aa.com.tr/en/rss/default?cat=world', '["aa.com.tr"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.aa.com.tr/en', 'https://www.facebook.com/anadoluagencyenglish/'),
  ('The Straits Times', 'https://www.straitstimes.com/news/world/rss.xml', '["straitstimes.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.straitstimes.com/global', 'https://www.facebook.com/TheStraitsTimes/'),
  ('The Times of India', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', '["indiatimes.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://timesofindia.indiatimes.com', 'https://www.facebook.com/TimesofIndia/'),
  ('UPI', 'https://rss.upi.com/news/tn_int.rss', '["upi.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.upi.com', 'https://www.facebook.com/upi/'),
  ('CNBC', 'https://www.cnbc.com/id/100727362/device/rss/rss.html', '["cnbc.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.cnbc.com', 'https://www.facebook.com/cnbc/'),
  ('The Wall Street Journal', 'https://feeds.content.dowjones.io/public/rss/RSSWorldNews', '["dowjones.io","wsj.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.wsj.com/world', 'https://www.facebook.com/WSJ/'),
  ('The Economist', 'https://www.economist.com/the-world-this-week/rss.xml', '["economist.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.economist.com', 'https://www.facebook.com/TheEconomist/'),
  ('POLITICO Europe', 'https://www.politico.eu/feed/', '["politico.eu"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.politico.eu', 'https://www.facebook.com/POLITICO.eu/'),
  ('Der Spiegel International', 'https://www.spiegel.de/international/index.rss', '["spiegel.de"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.spiegel.de/international', 'https://www.facebook.com/derspiegel/'),
  ('RFI International', 'https://www.rfi.fr/en/international/rss', '["rfi.fr"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.rfi.fr/en/international', 'https://www.facebook.com/RFI/'),
  ('Le Monde English', 'https://www.lemonde.fr/en/rss/une.xml', '["lemonde.fr"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.lemonde.fr/en', 'https://www.facebook.com/lemonde.fr/'),
  ('Financial Times', 'https://www.ft.com/rss/home/international', '["ft.com"]', 'global', 1, datetime('now'), datetime('now'), 'https://www.ft.com/world', 'https://www.facebook.com/financialtimes/');


-- Keep the Sky News RSS subdomain within its official host allowlist.
UPDATE news_sources
SET hosts_json = '["skynews.com"]', updated_at = datetime('now')
WHERE source_name = 'Sky News' AND region = 'global';


-- Permit Sky News' own RSS host and article host, and no third-party domains.
UPDATE news_sources
SET hosts_json = '["sky.com", "skynews.com"]', updated_at = datetime('now')
WHERE source_name = 'Sky News' AND region = 'global';
