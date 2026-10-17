import test from "node:test";
import assert from "node:assert/strict";
import { runNewsPipeline } from "../news-pipeline.mjs";

test("news pipeline fetches only enabled, configured Myanmar and Global RSS sources from D1", async () => {
  const configured = [
    { source_name: "BBC Burmese", feed_url: "https://feeds.bbci.co.uk/burmese/rss.xml", hosts_json: '["bbci.co.uk","bbc.co.uk","bbc.com"]' },
    { source_name: "Mizzima News", feed_url: "https://feeds.example.org/rss.xml", hosts_json: '["example.org"]' }
  ];
  const fetched = [];
  const syncRows = [];
  let sourceQuery = "";
  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async all() {
          if (normalized.startsWith("select s.source_name, s.feed_url, s.hosts_json, s.region, coalesce(state.last_checked_at,'') as last_checked_at")) {
            sourceQuery = normalized;
            return { results: configured.map((row) => ({ ...row, region: row.region || "myanmar", last_checked_at: "" })) };
          }
          return { results: [] };
        },
        async run() {
          if (normalized.startsWith("insert into news_sync_state")) syncRows.push(values);
          return { meta: { changes: 1 } };
        }
      };
      return statement;
    }
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    fetched.push(String(url));
    return new Response("<rss><channel></channel></rss>", { status: 200, headers: { "content-type": "application/rss+xml" } });
  };
  try {
    const result = await runNewsPipeline({ DB });
    assert.equal(result.ok, true);
    assert.deepEqual(fetched, configured.map((source) => source.feed_url));
    assert.match(sourceQuery, /s\.region in \('myanmar', 'global'\) and s\.enabled = 1/);
    assert.equal(syncRows.length, configured.length);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("news pipeline can restrict a backfill to selected sources and a Bangkok publication window", async () => {
  const kicUrl = "https://kicnews.org/feed/";
  const stories = [
    ["before", "2026-10-08T16:59:59Z"],
    ["start", "2026-10-08T17:00:00Z"],
    ["middle", "2026-10-12T12:00:00Z"],
    ["last-day", "2026-10-16T16:59:59Z"],
    ["after", "2026-10-16T17:00:00Z"]
  ].map(([slug, date]) => `<item><title>Myanmar KIC story ${slug}</title><link>https://kicnews.org/story/${slug}</link><description><![CDATA[${"Verified source text for this report. ".repeat(60)}]]></description><pubDate>${date}</pubDate></item>`).join("");
  const feed = `<rss><channel>${stories}</channel></rss>`;
  const sources = [
    { source_name: "KIC", feed_url: kicUrl, hosts_json: '["kicnews.org"]' },
    { source_name: "Other Publisher", feed_url: "https://other.example/feed/", hosts_json: '["other.example"]' }
  ];
  const fetched = [];
  const insertedRows = [];
  const dedupeStarts = [];
  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
      const statement = {
        values: [],
        bind(...values) { statement.values = values; return statement; },
        async all() {
          if (normalized.startsWith("select s.source_name, s.feed_url, s.hosts_json, s.region, coalesce(state.last_checked_at,'') as last_checked_at")) {
            return { results: sources.map((row) => ({ ...row, region: row.region || "myanmar", last_checked_at: "" })) };
          }
          if (normalized.startsWith("select id, source_url, source_name, original_title, fingerprint, created_at from posts")) dedupeStarts.push(statement.values[0]);
          return { results: [] };
        },
        async run() { return { meta: { changes: 1 } }; }
      };
      return statement;
    },
    async batch(statements) {
      insertedRows.push(...statements.map((statement) => statement.values));
      return statements.map(() => ({ meta: { changes: 1 } }));
    }
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    fetched.push(address);
    if (address === kicUrl) return new Response(feed, { status: 200, headers: { "content-type": "application/rss+xml" } });
    if (address.includes("generativelanguage.googleapis.com")) {
      const request = JSON.parse(options.body);
      const articles = JSON.parse(request.contents[0].parts[0].text.split("\n").slice(1).join("\n"));
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(articles.map((article) => ({ index: article.index, titleMm: `မြန်မာသတင်း ${article.index}`, bodyMm: "မြန်မာ эх сурвалжийн баталгаатай мэдээллийг товч тайлбарлав." }))) }] } }] });
    }
    throw new Error(`Unexpected fetch: ${address}`);
  };
  try {
    const result = await runNewsPipeline({ DB, GEMINI_API_KEY: "test-key" }, {
      sourceNames: ["KIC"],
      publishedFrom: "2026-10-09T00:00:00+07:00",
      publishedBefore: "2026-10-17T00:00:00+07:00",
      maxItemsPerRun: 2
    });
    assert.equal(result.ok, true);
    assert.equal(result.inserted, 2);
    assert.equal(result.queued, 3);
    assert.equal(result.processed, 2);
    assert.deepEqual(dedupeStarts, ["2026-10-08T17:00:00.000Z"]);
    assert.deepEqual(fetched.filter((url) => url.includes("/feed/")), [kicUrl]);
    assert.deepEqual(insertedRows.map((row) => row[10]).sort(), ["Myanmar KIC story last-day", "Myanmar KIC story middle"]);
    assert.ok(insertedRows.every((row) => typeof row[5] === "string" && row[5].length > 100));
    await assert.rejects(() => runNewsPipeline({ DB }, { publishedFrom: "not-a-date", publishedBefore: "2026-10-17T00:00:00Z" }), /invalid_published_window/);
    await assert.rejects(() => runNewsPipeline({ DB }, { maxItemsPerRun: 13 }), /invalid_batch_limit/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("news summaries request fuller structured Burmese copy and translate in small batches", async () => {
  const feedUrl = "https://feeds.bbci.co.uk/burmese/rss.xml";
  const articleText = "Verified reporting on the event, location, date, response and current situation. ".repeat(30);
  const items = Array.from({ length: 4 }, (_, index) => `<item><title>Myanmar story headline number ${index + 1}</title><link>https://www.bbc.com/burmese/articles/story-${index + 1}</link><description><![CDATA[${articleText}]]></description><pubDate>Wed, 14 Oct 2026 10:0${index}:00 GMT</pubDate></item>`).join("");
  const feed = `<rss><channel>${items}</channel></rss>`;
  const insertedRows = [];
  const requestBatches = [];
  const batchSizes = [];
  const source = { source_name: "BBC Burmese", feed_url: feedUrl, hosts_json: '["bbci.co.uk","bbc.co.uk","bbc.com"]' };
  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
      const statement = {
        values: [],
        bind(...values) { statement.values = values; return statement; },
        async all() {
          if (normalized.startsWith("select s.source_name, s.feed_url, s.hosts_json, s.region, coalesce(state.last_checked_at,'') as last_checked_at")) {
            return { results: [{ ...source, region: source.region || "myanmar", last_checked_at: "" }] };
          }
          return { results: [] };
        },
        async run() { return { meta: { changes: 1 } }; }
      };
      return statement;
    },
    async batch(statements) {
      batchSizes.push(statements.length);
      insertedRows.push(...statements.map((statement) => statement.values));
      return statements.map(() => ({ meta: { changes: 1 } }));
    }
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (address === feedUrl) return new Response(feed, { status: 200, headers: { "content-type": "application/rss+xml" } });
    if (address.includes("generativelanguage.googleapis.com")) {
      const request = JSON.parse(options.body);
      const text = request.contents[0].parts[0].text;
      const articles = JSON.parse(text.slice(text.indexOf("\n") + 1));
      requestBatches.push({ request, articles });
      const rows = articles.map((article) => ({
        index: article.index,
        titleMm: `မြန်မာသတင်း ${requestBatches.length}-${article.index}`,
        bodyMm: "ဖြစ်ရပ်အကျဉ်းနှင့် အတည်ပြုထားသော အသေးစိတ်ကို ဖော်ပြထားသည်။\n\nလက်ရှိအခြေအနေနှင့် သက်ဆိုင်သူများ၏ တုံ့ပြန်ချက်ကို ရှင်းလင်းတင်ပြထားသည်။"
      }));
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(rows) }] } }] });
    }
    throw new Error(`Unexpected fetch: ${address}`);
  };
  try {
    const result = await runNewsPipeline({ DB, GEMINI_API_KEY: "test-key" });
    assert.equal(result.ok, true);
    assert.equal(result.inserted, 4);
    assert.deepEqual(requestBatches.map(({ articles }) => articles.length), [3, 1]);
    assert.deepEqual(batchSizes, [4]);
    assert.equal(insertedRows.length, 4);
    assert.ok(requestBatches.every(({ request }) => {
      const prompt = request.systemInstruction.parts[0].text;
      return prompt.includes("၄ မှ ၆ ပိုဒ်") && prompt.includes("listingOnly") && prompt.includes("အတည်ပြုထားသော အသေးစိတ်") && prompt.includes("မတီထွင်");
    }));
    assert.ok(requestBatches.flatMap(({ articles }) => articles).every((article) => article.text.length > 1800 && article.listingOnly === false));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
