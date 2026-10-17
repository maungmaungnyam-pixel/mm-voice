UPDATE news_sources
SET hosts_json = '["sky.com", "skynews.com"]', updated_at = datetime('now')
WHERE source_name = 'Sky News' AND region = 'global';
