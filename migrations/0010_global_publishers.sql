ALTER TABLE news_sources RENAME TO news_sources_before_global;

CREATE TABLE news_sources (
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

INSERT INTO news_sources (source_name, feed_url, hosts_json, region, enabled, created_at, updated_at)
SELECT source_name, feed_url, hosts_json, region, enabled, created_at, updated_at
FROM news_sources_before_global;

DROP TABLE news_sources_before_global;
CREATE INDEX news_sources_enabled_name_idx ON news_sources(region, enabled, source_name);

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
