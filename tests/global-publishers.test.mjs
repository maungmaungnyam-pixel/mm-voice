import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "../worker.mjs";

const globalPublisher = {
  source_name: "BBC World",
  region: "global",
  official_website: "https://www.bbc.com/news/world",
  facebook_url: "https://www.facebook.com/bbcnews/"
};

function queryDb({ publisher = globalPublisher, posts = [] } = {}) {
  const calls = [];
  const DB = {
    prepare(sql) {
      const query = sql.replace(/\s+/g, " ").trim();
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async first() {
          calls.push({ query, values, method: "first" });
          if (query.includes("FROM news_sources") && query.includes("source_name = ?")) {
            return values.includes(publisher.source_name) ? publisher : null;
          }
          return null;
        },
        async all() {
          calls.push({ query, values, method: "all" });
          if (query.includes("FROM news_sources WHERE region = ?")) {
            return { results: [publisher].filter((row) => row.region === values[0]) };
          }
          if (query.includes("FROM posts WHERE type = ? AND source_name = ?")) return { results: posts };
          if (query.includes("FROM posts WHERE type = ? AND source_name IN (SELECT source_name FROM news_sources WHERE region='global' AND enabled=1)")) return { results: posts };
          return { results: [] };
        }
      };
      return statement;
    }
  };
  return { DB, calls };
}

test("Global feed endpoint filters only enabled Global sources", async () => {
  const { DB, calls } = queryDb({ posts: [{ id: "global-story", type: "news", title: "Global story", source_name: globalPublisher.source_name, source_url: "https://www.bbc.com/news/world/1", created_at: "2026-10-16T00:00:00.000Z" }] });
  const response = await worker.fetch(new Request("https://mm-voice.test/api/posts?type=news&region=global"), { DB });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.region, "global");
  assert.deepEqual(data.items.map((item) => item.sourceName), ["BBC World"]);
  assert.deepEqual(data.items.map((item) => item.region), ["global"]);
  assert.match(calls[0].query, /news_sources WHERE region='global' AND enabled=1/);
  assert.match(calls[0].query, /ORDER BY created_at DESC, id DESC LIMIT 150/);
  assert.deepEqual(calls[0].values, ["news"]);
});

test("default /api/posts remains Myanmar-only", async () => {
  const { DB, calls } = queryDb();
  const response = await worker.fetch(new Request("https://mm-voice.test/api/posts?type=news"), { DB });
  assert.equal(response.status, 200);
  assert.match(calls[0].query, /news_sources WHERE region='myanmar' AND enabled=1/);
  assert.match(calls[0].query, /ORDER BY COALESCE\(updated_at, created_at\) DESC, created_at DESC, id DESC LIMIT 150/);
  assert.doesNotMatch(calls[0].query, /region='global'/);
  assert.deepEqual(calls[0].values, ["news", "MM VOICE Admin"]);
});

test("publisher directory returns organized source metadata for the selected region", async () => {
  const { DB, calls } = queryDb();
  const response = await worker.fetch(new Request("https://mm-voice.test/api/publishers?region=global"), { DB });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.region, "global");
  assert.deepEqual(data.items, [{
    sourceName: "BBC World",
    region: "global",
    websiteUrl: "https://www.bbc.com/news/world",
    facebookUrl: "https://www.facebook.com/bbcnews/"
  }]);
  assert.match(calls[0].query, /news_sources WHERE region = \? AND enabled = 1 ORDER BY source_name/i);
  assert.deepEqual(calls[0].values, ["global"]);
});

test("publisher profile API exposes validated Website and Facebook links", async () => {
  const { DB } = queryDb();
  const response = await worker.fetch(new Request("https://mm-voice.test/api/publishers?sourceName=BBC%20World"), { DB });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(data.publisher, {
    sourceName: "BBC World",
    region: "global",
    websiteUrl: "https://www.bbc.com/news/world",
    facebookUrl: "https://www.facebook.com/bbcnews/"
  });
});

test("unknown regions and publishers are rejected", async () => {
  const { DB } = queryDb();
  const regionResponse = await worker.fetch(new Request("https://mm-voice.test/api/publishers?region=other"), { DB });
  assert.equal(regionResponse.status, 400);
  assert.equal((await regionResponse.json()).error, "invalid_region");
  const sourceResponse = await worker.fetch(new Request("https://mm-voice.test/api/publishers?sourceName=Unknown"), { DB });
  assert.equal(sourceResponse.status, 404);
  assert.equal((await sourceResponse.json()).error, "publisher_not_found");
});

test("new migration seeds exactly 30 Global publisher feeds and fresh schema accepts both regions", async () => {
  const migration = await readFile(new URL("../migrations/0010_global_publishers.sql", import.meta.url), "utf8");
  const skyHostMigration = await readFile(new URL("../migrations/0011_sky_news_feed_host.sql", import.meta.url), "utf8");
  const skyStoryMigration = await readFile(new URL("../migrations/0012_sky_news_story_domain.sql", import.meta.url), "utf8");
  const schema = await readFile(new URL("../schema.sql", import.meta.url), "utf8");
  const seeds = migration.split("\n").filter((line) => /^\s*\('[^']+',/.test(line) && line.includes("'global', 1,"));
  assert.equal(seeds.length, 30);
  assert.match(migration, /official_website TEXT NOT NULL DEFAULT ''/);
  assert.match(migration, /facebook_url TEXT NOT NULL DEFAULT ''/);
  assert.match(skyHostMigration, /hosts_json = '\["skynews\.com"\]'/);
  assert.match(skyHostMigration, /source_name = 'Sky News' AND region = 'global'/);
  assert.match(skyStoryMigration, /hosts_json = '\["sky\.com", "skynews\.com"\]'/);
  assert.match(schema, /CHECK \(region IN \('myanmar', 'global'\)\)/);
});

test("main shell exposes Global, Publishers, and a top-header notification control", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(html, /id="notification-toggle"/);
  assert.match(html, /data-view="global"/);
  assert.match(html, /id="global-panel"/);
  assert.match(html, /id="drawer-publishers"/);
  assert.match(html, /data-publisher-region="myanmar"/);
  assert.match(html, /data-publisher-region="global"/);
  assert.match(html, /id="publisher-links"/);
  assert.match(app, /api\/posts\?type=news&region=global/);
  assert.match(app, /publisher-profile-link/);
});
