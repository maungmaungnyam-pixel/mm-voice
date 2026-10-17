import test from "node:test";
import assert from "node:assert/strict";
import { parseWordPressRestItems, runNewsPipeline } from "../news-pipeline.mjs";

const wordpressSource = {
  name: "Kantarawaddy Times",
  region: "myanmar",
  feedUrl: "https://www.kantarawaddytimes.org/wp-json/wp/v2/posts?per_page=20&_embed=wp:featuredmedia&_fields=id,date_gmt,link,title,excerpt,featured_media,_links,_embedded",
  hosts: ["kantarawaddytimes.org"]
};

function createQueueDb(sources) {
  const queue = new Map();
  const posts = new Map();
  const sourceRegions = new Map(sources.map((source) => [source.source_name || source.name, source.region]));
  const syncRows = [];
  const notifications = [];
  const idLookupSizes = [];
  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
      const statement = {
        values: [],
        bind(...values) { statement.values = values; return statement; },
        async all() {
          if (normalized.startsWith("select s.source_name, s.feed_url, s.hosts_json, s.region, coalesce(state.last_checked_at,'') as last_checked_at")) {
            const checkedAt = new Map(syncRows.map(([sourceName, , lastCheckedAt]) => [sourceName, lastCheckedAt]));
            const ordered = sources.map((row) => ({ ...row, last_checked_at: checkedAt.get(row.source_name) || "" }))
              .sort((a, b) => (a.last_checked_at || "").localeCompare(b.last_checked_at || "") || a.region.localeCompare(b.region) || a.source_name.localeCompare(b.source_name));
            return { results: ordered };
          }
          if (normalized.startsWith("select id, source_url, source_name, original_title, fingerprint, created_at from posts")) {
            const cutoff = statement.values[0];
            return { results: [...posts.values()].filter((row) => row.created_at >= cutoff).slice(0, 500) };
          }
          if (normalized.startsWith("select source_url from admin_post_suppressions")) return { results: [] };
          if (normalized.startsWith("select id from posts where id in (")) {
            idLookupSizes.push(statement.values.length);
            if (statement.values.length > 80) throw new Error("too_many_sql_variables");
            const ids = new Set(statement.values);
            return { results: [...posts.values()].filter((row) => ids.has(row.id)).map((row) => ({ id: row.id })) };
          }
          if (normalized.startsWith("select queue_key,post_id,source_name,region,title,description,source_url,published_at,image_url,video_url,hosts_json,fingerprint,queued_at,available_at,attempts from news_ingestion_queue")) {
            const now = statement.values[0];
            const globalDayStart = statement.values[1];
            return { results: [...queue.values()].filter((row) => row.status === "queued" && row.available_at <= now &&
              (row.region !== "global" || !row.published_at || (row.published_at >= globalDayStart && row.published_at <= now)))
              .sort((a, b) => a.queued_at.localeCompare(b.queued_at)).slice(0, 1000) };
          }
          return { results: [] };
        },
        async first() {
          if (normalized.startsWith("select count(*) as count, min(coalesce(nullif(p.updated_at,''),p.created_at)) as oldest_at from posts p where p.type='news'")) {
            const [cutoff, now] = statement.values;
            const recent = [...posts.values()].filter((row) => sourceRegions.get(row.source_name) === "global" &&
              (row.updated_at || row.created_at) >= cutoff && (row.updated_at || row.created_at) <= now);
            return { count: recent.length, oldest_at: recent.map((row) => row.updated_at || row.created_at).sort()[0] || null };
          }
          if (normalized.startsWith("select id from posts where id = ?")) {
            const row = posts.get(statement.values[0]);
            return row ? { id: row.id } : null;
          }
          return null;
        },
        async run() {
          if (normalized.startsWith("insert into news_sync_state")) { syncRows.push(statement.values); return { meta: { changes: 1 } }; }
          if (normalized.startsWith("insert or ignore into news_ingestion_queue")) {
            const [queue_key, post_id, source_name, region, title, description, source_url, published_at, image_url, video_url, hosts_json, fingerprint, queued_at, available_at] = statement.values;
            if (queue.has(queue_key)) return { meta: { changes: 0 } };
            queue.set(queue_key, { queue_key, post_id, source_name, region, title, description, source_url, published_at, image_url, video_url, hosts_json, fingerprint, queued_at, available_at, attempts: 0, status: "queued", processed_at: "", last_error: "" });
            return { meta: { changes: 1 } };
          }
          if (normalized.startsWith("insert or ignore into posts")) {
            const [id, title, image_url, video_url, body, original_body, source_name, source_url, created_at, updated_at, original_title, fingerprint] = statement.values;
            if (posts.has(id)) return { meta: { changes: 0 } };
            if (normalized.includes("where (select count(*)")) {
              const [cutoff, now, limit] = statement.values.slice(12);
              const globalCount = [...posts.values()].filter((row) => sourceRegions.get(row.source_name) === "global" &&
                (row.updated_at || row.created_at) >= cutoff && (row.updated_at || row.created_at) <= now).length;
              if (globalCount >= limit) return { meta: { changes: 0 } };
            }
            posts.set(id, { id, type: "news", title, image_url, video_url, body, original_body, source_name, source_url, created_at, updated_at, original_title, fingerprint });
            return { meta: { changes: 1 } };
          }
          if (normalized.startsWith("update news_ingestion_queue set status='processed'")) {
            const [processed_at, queue_key] = statement.values;
            const row = queue.get(queue_key);
            if (row) Object.assign(row, { status: "processed", processed_at, last_error: "" });
            return { meta: { changes: row ? 1 : 0 } };
          }
          if (normalized.startsWith("update news_ingestion_queue set attempts=attempts+1")) {
            const [available_at, last_error, queue_key] = statement.values;
            const row = queue.get(queue_key);
            if (row) Object.assign(row, { attempts: row.attempts + 1, available_at, last_error });
            return { meta: { changes: row ? 1 : 0 } };
          }
          if (normalized.startsWith("update news_ingestion_queue set available_at=?,last_error='global_hourly_limit'")) {
            const [available_at, queue_key] = statement.values;
            const row = queue.get(queue_key);
            if (row) Object.assign(row, { available_at, last_error: "global_hourly_limit" });
            return { meta: { changes: row ? 1 : 0 } };
          }
          if (normalized.startsWith("insert or ignore into notifications")) { notifications.push(statement.values); return { meta: { changes: 1 } }; }
          return { meta: { changes: 1 } };
        }
      };
      return statement;
    },
    async batch(statements) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
    _queue: queue,
    _posts: posts,
    _syncRows: syncRows,
    _notifications: notifications,
    _idLookupSizes: idLookupSizes
  };
  return DB;
}

test("WordPress REST JSON feeds normalize safe links, UTC dates, excerpt, and featured image", () => {
  const row = {
    title: { rendered: "<p>ကရင်နီပြည် သတင်းဖြစ်ရပ် အသစ်</p>" },
    link: "https://www.kantarawaddytimes.org/news/43570/",
    date_gmt: "2026-10-16T14:14:34",
    excerpt: { rendered: "<p>ဒေသခံများက သတင်းအချက်အလက်ကို အတည်ပြုခဲ့သည်။</p>" },
    _embedded: { "wp:featuredmedia": [{ source_url: "https://www.kantarawaddytimes.org/wp-content/uploads/story.jpg" }] }
  };
  const [item] = parseWordPressRestItems(JSON.stringify([row]), wordpressSource);
  assert.equal(item.sourceName, "Kantarawaddy Times");
  assert.equal(item.sourceUrl, row.link);
  assert.equal(item.publishedAt, "2026-10-16T14:14:34.000Z");
  assert.match(item.description, /ဒေသခံများ/);
  assert.equal(item.imageUrl, "https://www.kantarawaddytimes.org/wp-content/uploads/story.jpg");
  assert.deepEqual(parseWordPressRestItems(JSON.stringify([{ ...row, link: "https://evil.example/story/1" }]), wordpressSource), []);
});

test("publisher polling round-robins by D1 last-checked state and continues after a feed error", async () => {
  const sources = [
    ...Array.from({ length: 5 }, (_, index) => ({ source_name: `Global ${String(index).padStart(2, "0")}`, feed_url: `https://global-${String(index).padStart(2, "0")}.example/feed/`, hosts_json: `["global-${String(index).padStart(2, "0")}.example"]`, region: "global" })),
    ...Array.from({ length: 5 }, (_, index) => ({ source_name: `Myanmar ${String(index).padStart(2, "0")}`, feed_url: `https://myanmar-${String(index).padStart(2, "0")}.example/feed/`, hosts_json: `["myanmar-${String(index).padStart(2, "0")}.example"]`, region: "myanmar" }))
  ];
  const DB = createQueueDb(sources);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("myanmar-01")) return new Response("temporary source failure", { status: 503 });
    return new Response("<rss><channel></channel></rss>", { status: 200, headers: { "content-type": "application/rss+xml" } });
  };
  try {
    const first = await runNewsPipeline({ DB }, { queueMode: true, processQueue: false, maxSourcesPerRun: 4 });
    const firstNames = new Set(first.sources.map((source) => source.source));
    assert.deepEqual([...firstNames].sort(), ["Global 00", "Myanmar 00", "Myanmar 01", "Myanmar 02"]);
    assert.equal(first.sources.length, 4);
    assert.equal(first.sources.find((source) => source.source === "Myanmar 01").ok, false);
    assert.equal(first.sources.filter((source) => source.ok).length, 3);
    assert.equal(DB._syncRows.length, 4);

    const second = await runNewsPipeline({ DB }, { queueMode: true, processQueue: false, maxSourcesPerRun: 4 });
    assert.equal(second.sources.length, 4);
    assert.equal(second.sources.filter((source) => source.source.startsWith("Myanmar")).length, 3);
    assert.equal(second.sources.filter((source) => source.source.startsWith("Global")).length, 1);
    assert.equal(second.sources.some((source) => source.source === "Global 01"), true);
    assert.equal(DB._syncRows.length, 8);

    const third = await runNewsPipeline({ DB }, { queueMode: true, processQueue: false, maxSourcesPerRun: 4 });
    const thirdNames = new Set(third.sources.map((source) => source.source));
    assert.equal(third.sources.filter((source) => source.source.startsWith("Myanmar")).length, 3);
    assert.equal(third.sources.filter((source) => source.source.startsWith("Global")).length, 1);
    assert.equal([...thirdNames].filter((name) => firstNames.has(name)).length <= 3, true);
    assert.equal(DB._syncRows.length, 12);
    await assert.rejects(() => runNewsPipeline({ DB }, { maxSourcesPerRun: 11 }), /invalid_source_batch_size/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("scheduled queue stores a verified WordPress item, translates it, and marks it processed", async () => {
  const DB = createQueueDb([{ ...wordpressSource, source_name: wordpressSource.name, feed_url: wordpressSource.feedUrl, hosts_json: JSON.stringify(wordpressSource.hosts) }]);
  const published = new Date().toISOString();
  const apiRow = {
    title: { rendered: "ကရင်နီပြည်တွင် ဒေသခံများအတွက် အရေးပေါ်သတင်း အသစ်" },
    link: "https://www.kantarawaddytimes.org/news/43570/",
    date_gmt: published.replace(/\.\d{3}Z$/, ""),
    excerpt: { rendered: "<p>ဒေသခံများက အရေးပေါ်အခြေအနေကို ထုတ်ပြန်ပြောကြားခဲ့သည်။</p>" }
  };
  const fullArticle = `<article>${"Verified reporting from Kantarawaddy Times. ".repeat(45)}</article>`;
  const geminiRequests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (address === wordpressSource.feedUrl) return Response.json([apiRow]);
    if (address === apiRow.link) return new Response(fullArticle, { status: 200, headers: { "content-type": "text/html" } });
    if (address.includes("generativelanguage.googleapis.com")) {
      const request = JSON.parse(options.body);
      const prompt = request.contents[0].parts[0].text;
      const articles = JSON.parse(prompt.slice(prompt.indexOf("\n") + 1));
      geminiRequests.push(articles);
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(articles.map((article) => ({ index: article.index, titleMm: "မြန်မာသිතийн шинэ гарчиг", bodyMm: "မြန်မာ хэл дээрх баталгаатай мэдээллийг тайлбарласан мэдээ юм။" }))) }] } }] });
    }
    throw new Error(`Unexpected fetch: ${address}`);
  };
  try {
    const result = await runNewsPipeline({ DB, GEMINI_API_KEY: "test-key" }, { queueMode: true, processQueue: true, maxItemsPerRun: 4 });
    assert.equal(result.ok, true);
    assert.equal(result.queued, 1);
    assert.equal(result.processed, 1);
    assert.equal(result.inserted, 1);
    assert.equal(DB._posts.size, 1);
    assert.equal([...DB._queue.values()][0].status, "processed");
    assert.equal(geminiRequests.length, 1);
    assert.match([...DB._posts.values()][0].source_url, /kantarawaddytimes\.org/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("candidate ID lookups are chunked below D1's SQL variable limit", async () => {
  const sources = Array.from({ length: 6 }, (_, index) => ({
    source_name: `Publisher ${index}`,
    feed_url: `https://publisher-${index}.example/feed.xml`,
    hosts_json: JSON.stringify([`publisher-${index}.example`]),
    region: "myanmar"
  }));
  const DB = createQueueDb(sources);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const sourceIndex = Number(new URL(url).hostname.match(/publisher-(\d+)/)?.[1]);
    const items = Array.from({ length: 30 }, (_, index) => {
      const id = sourceIndex * 30 + index;
      const link = `https://publisher-${sourceIndex}.example/story/${id}`;
      const pubDate = new Date(Date.now() - index * 60_000).toUTCString();
      return `<item><title>Publisher ${sourceIndex} report ${id} about incident ${id} in township ${id}</title><link>${link}</link><guid>${link}</guid><pubDate>${pubDate}</pubDate><description>Unique reporting item ${id}.</description></item>`;
    }).join("");
    return new Response(`<rss><channel>${items}</channel></rss>`, { status: 200, headers: { "content-type": "application/rss+xml" } });
  };
  try {
    const result = await runNewsPipeline({ DB }, { queueMode: true, processQueue: false });
    assert.equal(result.queued, 180);
    assert.equal(DB._queue.size, 180);
    assert.deepEqual(DB._idLookupSizes, [80, 80, 20]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("queue post-ID lookup chunks a large existing backlog under D1's SQL variable limit", async () => {
  const DB = createQueueDb([]);
  const queuedAt = new Date(Date.now() - 60_000).toISOString();
  for (let index = 0; index < 128; index++) {
    const sourceUrl = `https://publisher-0.example/story/${index}`;
    const row = {
      queue_key: `queue-${index}`,
      post_id: `feed-${index}`,
      source_name: "Publisher 0",
      region: "myanmar",
      title: `Verified report ${index}`,
      description: `Description ${index}`,
      source_url: sourceUrl,
      published_at: queuedAt,
      image_url: "",
      video_url: "",
      hosts_json: '["publisher-0.example"]',
      fingerprint: `fingerprint-${index}`,
      queued_at: queuedAt,
      available_at: queuedAt,
      attempts: 0,
      status: "queued",
      processed_at: "",
      last_error: ""
    };
    DB._queue.set(row.queue_key, row);
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (address.startsWith("https://publisher-0.example/story/")) {
      return new Response(`<article>${"Verified publisher reporting. ".repeat(45)}</article>`, { status: 200, headers: { "content-type": "text/html" } });
    }
    if (address.includes("generativelanguage.googleapis.com")) {
      const request = JSON.parse(options.body);
      const prompt = request.contents[0].parts[0].text;
      const articles = JSON.parse(prompt.slice(prompt.indexOf("\n") + 1));
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(articles.map((article) => ({ index: article.index, titleMm: "သတင်းခေါင်းစဉ်", bodyMm: "အတည်ပြုထားသော သတင်းအချက်အလက်ကို မြန်မာဘာသာဖြင့် ဖော်ပြထားသည်။" }))) }] } }] });
    }
    throw new Error(`Unexpected fetch: ${address}`);
  };
  try {
    const result = await runNewsPipeline({ DB, GEMINI_API_KEY: "test-key" }, { queueMode: true, processQueue: true, maxItemsPerRun: 1 });
    assert.equal(result.inserted, 1);
    assert.equal(result.processed, 1);
    assert.deepEqual(DB._idLookupSizes, [80, 48]);
    assert.equal(DB._posts.size, 1);
    assert.equal([...DB._queue.values()].filter((row) => row.status === "processed").length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("Gemini 429 backs off the failed batch and continues processing a later batch", async () => {
  const DB = createQueueDb([]);
  const queuedAt = new Date(Date.now() - 60_000).toISOString();
  for (let index = 0; index < 4; index++) {
    const sourceUrl = `https://publisher-0.example/rate-test/${index}`;
    const row = {
      queue_key: `rate-queue-${index}`,
      post_id: `rate-post-${index}`,
      source_name: "Publisher 0",
      region: "global",
      title: `Rate test report ${index}`,
      description: `Description ${index}`,
      source_url: sourceUrl,
      published_at: queuedAt,
      image_url: "",
      video_url: "",
      hosts_json: '["publisher-0.example"]',
      fingerprint: `rate-fingerprint-${index}`,
      queued_at: queuedAt,
      available_at: queuedAt,
      attempts: 0,
      status: "queued",
      processed_at: "",
      last_error: ""
    };
    DB._queue.set(row.queue_key, row);
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (address.startsWith("https://publisher-0.example/rate-test/")) {
      return new Response(`<article>${"Verified report content for a publisher story. ".repeat(40)}</article>`, { status: 200, headers: { "content-type": "text/html" } });
    }
    if (address.includes("generativelanguage.googleapis.com")) {
      const request = JSON.parse(options.body);
      const prompt = request.contents[0].parts[0].text;
      const articles = JSON.parse(prompt.slice(prompt.indexOf("\n") + 1));
      if (articles.some((article) => article.headline === "Rate test report 0")) {
        return new Response(JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED", message: "Free-tier request limit reached" } }), { status: 429, headers: { "content-type": "application/json" } });
      }
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(articles.map((article) => ({ index: article.index, titleMm: `မြန်မာခေါင်းစဉ် ${article.index}`, bodyMm: "စစ်ဆေးထားသော သတင်းအကြောင်းအရာ ဖြစ်သည်။" }))) }] } }] });
    }
    throw new Error(`Unexpected fetch: ${address}`);
  };
  try {
    const result = await runNewsPipeline({ DB, GEMINI_API_KEY: "test-key" }, { queueMode: true, processQueue: true, maxItemsPerRun: 4 });
    assert.equal(result.inserted, 1);
    assert.equal(result.processed, 1);
    assert.equal(result.retried, 3);
    assert.equal(DB._posts.size, 1);
    assert.equal([...DB._queue.values()].filter((row) => row.status === "processed").length, 1);
    const retriedRows = [...DB._queue.values()].filter((row) => row.status === "queued");
    assert.equal(retriedRows.length, 3);
    assert.ok(retriedRows.every((row) => row.attempts === 1 && row.last_error === "gemini_rate_limited"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("Global ingestion queues only stories published today in Bangkok", async () => {
  const source = {
    source_name: "Global Wire",
    feed_url: "https://global-wire.example/feed.xml",
    hosts_json: '["global-wire.example"]',
    region: "global"
  };
  const DB = createQueueDb([source]);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  const todayStart = Date.parse(`${parts.year}-${parts.month}-${parts.day}T00:00:00+07:00`);
  const currentStoryDate = new Date(Date.now() - 5 * 60 * 1000).toUTCString();
  const priorDayDate = new Date(todayStart - 60 * 1000).toUTCString();
  const feed = `<rss><channel>
    <item><title>Global market and government report published today</title><link>https://global-wire.example/story/today</link><guid>https://global-wire.example/story/today</guid><pubDate>${currentStoryDate}</pubDate><description>Today's verified update from the publisher.</description></item>
    <item><title>Previous day global entertainment report</title><link>https://global-wire.example/story/yesterday</link><guid>https://global-wire.example/story/yesterday</guid><pubDate>${priorDayDate}</pubDate><description>Yesterday's older story.</description></item>
  </channel></rss>`;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url) === source.feed_url) return new Response(feed, { status: 200, headers: { "content-type": "application/rss+xml" } });
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try {
    const result = await runNewsPipeline({ DB }, { queueMode: true, processQueue: false, sourceNames: [source.source_name], maxSourcesPerRun: 1 });
    assert.equal(result.queued, 1);
    assert.equal(DB._queue.size, 1);
    assert.equal([...DB._queue.values()][0].source_url, "https://global-wire.example/story/today");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Global queue caps posts at five per hour, prioritizes critical stories, and retains stale queue items", async () => {
  const sources = [
    { source_name: "Global Wire A", feed_url: "https://global-a.example/feed.xml", hosts_json: '["global-a.example"]', region: "global" },
    { source_name: "Global Wire B", feed_url: "https://global-b.example/feed.xml", hosts_json: '["global-b.example"]', region: "global" }
  ];
  const DB = createQueueDb(sources);
  const now = new Date().toISOString();
  const recent = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  for (let index = 0; index < 4; index++) {
    const id = `already-published-${index}`;
    DB._posts.set(id, { id, type: "news", source_name: "Global Wire A", created_at: recent, updated_at: recent });
  }
  const makeQueueItem = (key, sourceName, title, publishedAt, sourceUrl) => ({
    queue_key: key, post_id: `feed-${key}`, source_name: sourceName, region: "global", title,
    description: "Verified publisher reporting.", source_url: sourceUrl, published_at: publishedAt,
    image_url: "", video_url: "", hosts_json: '["global-a.example","global-b.example"]', fingerprint: `fingerprint-${key}`,
    queued_at: recent, available_at: now, attempts: 0, status: "queued", processed_at: "", last_error: ""
  });
  const urgent = makeQueueItem("urgent", "Global Wire A", "Breaking: major earthquake and tsunami warning issued", now, "https://global-a.example/story/urgent");
  const routine = makeQueueItem("routine", "Global Wire B", "Weekend entertainment schedule announced", now, "https://global-b.example/story/routine");
  const stale = makeQueueItem("stale-2023", "Global Wire A", "2023 archived story", "2023-07-21T07:45:00.000Z", "https://global-a.example/story/archive");
  DB._queue.set(urgent.queue_key, urgent);
  DB._queue.set(routine.queue_key, routine);
  DB._queue.set(stale.queue_key, stale);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (address.includes("global-a.example/story/urgent")) return new Response(`<article>${"Verified reporting on the earthquake and tsunami warning. ".repeat(35)}</article>`, { status: 200, headers: { "content-type": "text/html" } });
    if (address.includes("generativelanguage.googleapis.com")) {
      const request = JSON.parse(options.body);
      const prompt = request.contents[0].parts[0].text;
      const articles = JSON.parse(prompt.slice(prompt.indexOf("\n") + 1));
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(articles.map((article) => ({ index: article.index, titleMm: "အရေးကြီးသတင်းခေါင်းစဉ်", bodyMm: "အတည်ပြုထားသော အရေးကြီးသတင်းအချက်အလက်ကို မြန်မာဘာသာဖြင့် ဖော်ပြထားသည်။" }))) }] } }] });
    }
    throw new Error(`Unexpected fetch: ${address}`);
  };
  try {
    const result = await runNewsPipeline({ DB, GEMINI_API_KEY: "test-key" }, { queueMode: true, processQueue: true, maxItemsPerRun: 3, sourceNames: [] });
    assert.equal(result.inserted, 1);
    assert.equal(result.processed, 1);
    assert.equal([...DB._posts.values()].filter((post) => post.source_name.startsWith("Global Wire")).length, 5);
    assert.equal(DB._queue.get("urgent").status, "processed");
    assert.equal(DB._queue.get("routine").status, "queued");
    assert.equal(DB._queue.get("stale-2023").status, "queued");
    assert.equal([...DB._posts.values()].some((post) => post.original_title === urgent.title), true);

    const next = await runNewsPipeline({ DB }, { queueMode: true, processQueue: true, maxItemsPerRun: 3, sourceNames: [] });
    assert.equal(next.inserted, 0);
    assert.equal(next.processed, 0);
    assert.equal(DB._queue.get("routine").status, "queued");
    assert.equal(DB._queue.get("stale-2023").status, "queued");
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("Global ranking places outbreak, armed attack, and lethal-shooting news ahead of newer routine items", async () => {
  const source = { source_name: "Global Priority Wire", feed_url: "https://priority.example/feed.xml", hosts_json: '["priority.example"]', region: "global" };
  const DB = createQueueDb([source]);
  const now = new Date().toISOString();
  const items = [
    ["iran-attack", "Iran gives Houthis targeting and intelligence for attacks on Saudi Arabia", new Date(Date.now() - 15 * 60 * 1000).toISOString()],
    ["ebola", "Kenya confirms third Ebola case", new Date(Date.now() - 10 * 60 * 1000).toISOString()],
    ["school-shooting", "Teacher tackled shooter who killed 4 at Oregon school", new Date(Date.now() - 5 * 60 * 1000).toISOString()],
    ["routine", "Weekend entertainment schedule announced", now]
  ];
  for (const [key, title, publishedAt] of items) {
    const row = {
      queue_key: key, post_id: `feed-${key}`, source_name: source.source_name, region: "global", title,
      description: "Verified report from a Global publisher.", source_url: `https://priority.example/story/${key}`, published_at: publishedAt,
      image_url: "", video_url: "", hosts_json: source.hosts_json, fingerprint: `fingerprint-${key}`,
      queued_at: now, available_at: now, attempts: 0, status: "queued", processed_at: "", last_error: ""
    };
    DB._queue.set(key, row);
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (address.startsWith("https://priority.example/story/")) return new Response(`<article>${"Verified international news report. ".repeat(35)}</article>`, { status: 200, headers: { "content-type": "text/html" } });
    if (address.includes("generativelanguage.googleapis.com")) {
      const request = JSON.parse(options.body);
      const prompt = request.contents[0].parts[0].text;
      const articles = JSON.parse(prompt.slice(prompt.indexOf("\n") + 1));
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(articles.map((article) => ({ index: article.index, titleMm: `သတင်း ${article.index}`, bodyMm: "အတည်ပြုထားသော နိုင်ငံတကာသတင်းကို မြန်မာဘာသာဖြင့် ဖော်ပြထားသည်။" }))) }] } }] });
    }
    throw new Error(`Unexpected fetch: ${address}`);
  };
  try {
    const result = await runNewsPipeline({ DB, GEMINI_API_KEY: "test-key" }, { queueMode: true, processQueue: true, maxItemsPerRun: 3, sourceNames: [] });
    assert.equal(result.inserted, 3);
    const publishedTitles = new Set([...DB._posts.values()].map((post) => post.original_title));
    assert.equal(publishedTitles.has(items[0][1]), true);
    assert.equal(publishedTitles.has(items[1][1]), true);
    assert.equal(publishedTitles.has(items[2][1]), true);
    assert.equal(publishedTitles.has(items[3][1]), false);
    assert.equal(DB._queue.get("routine").status, "queued");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
