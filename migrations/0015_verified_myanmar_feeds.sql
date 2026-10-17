UPDATE news_sources
SET feed_url = 'https://mpanews.info/feed/', updated_at = datetime('now')
WHERE source_name = 'MPA' AND region = 'myanmar';

UPDATE news_sources
SET feed_url = 'https://www.kantarawaddytimes.org/wp-json/wp/v2/posts?per_page=20&_embed=wp:featuredmedia&_fields=id,date_gmt,link,title,excerpt,featured_media,_links,_embedded',
    hosts_json = '["kantarawaddytimes.org"]',
    official_website = 'https://www.kantarawaddytimes.org/',
    updated_at = datetime('now')
WHERE source_name = 'Kantarawaddy Times (ကန္တာရဝတီတိုင်း(မ်) - ကယား)' AND region = 'myanmar';
