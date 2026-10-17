UPDATE news_sources
SET hosts_json = '["skynews.com"]', updated_at = datetime('now')
WHERE source_name = 'Sky News' AND region = 'global';
