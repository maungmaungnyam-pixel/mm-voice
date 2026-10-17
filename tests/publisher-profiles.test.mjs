import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "../worker.mjs";

const publisher = "Kachin News Group - KNG";
const rows = [
  { id: "post-kng-1", type: "news", title: "KNG story", category: "News", image_url: "", video_url: "", body: "KNG summary", source_name: publisher, source_url: "https://kachinnews.com/story", created_at: "2026-10-15T10:00:00.000Z" },
  { id: "post-other-1", type: "news", title: "Other story", category: "News", image_url: "", video_url: "", body: "Other summary", source_name: "BBC Burmese", source_url: "https://bbc.com/story", created_at: "2026-10-15T09:00:00.000Z" }
];

function sourceFeedDB() {
  return {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        async first() {
          if (sql.includes("FROM news_sources") && (sql.includes("source_name = ?") || sql.includes("source_name=?"))) {
            return values.includes(publisher) ? { source_name: publisher, region: "myanmar", official_website: "https://kachinnews.com", facebook_url: "https://www.facebook.com/KachinNewsGroup/" } : null;
          }
          return null;
        },
        async all() {
          if (sql.includes("FROM posts WHERE type = ? AND source_name = ?")) {
            return { results: rows.filter((row) => row.type === values[0] && row.source_name === values[1]) };
          }
          return { results: [] };
        }
      };
    }
  };
}

test("publisher profile API returns stories for one enabled Myanmar source only", async () => {
  const response = await worker.fetch(new Request(`https://mm-voice.test/api/posts?type=news&sourceName=${encodeURIComponent(publisher)}`), { DB: sourceFeedDB() });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.sourceName, publisher);
  assert.deepEqual(data.items.map((item) => item.id), ["post-kng-1"]);
  assert.equal(data.items[0].sourceName, publisher);
});

test("publisher profile API does not expose disabled or unknown sources", async () => {
  const response = await worker.fetch(new Request("https://mm-voice.test/api/posts?type=news&sourceName=Unknown%20Publisher"), { DB: sourceFeedDB() });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "publisher_not_found");
});

test("news cards use the original publisher as a clickable profile identity", async () => {
  const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(app, /name\.textContent = publisherName \|\| 'MM VOICE'/);
  assert.match(app, /openPublisherProfile\(publisherName\)/);
  assert.match(app, /sourceName=\$\{encodeURIComponent\(sourceName\)\}/);
  assert.match(html, /id="publisher-profile"/);
  assert.match(html, /id="publisher-list"/);
});

test("the app shell and main frontend assets are not stored in client or CDN caches", async () => {
  const ASSETS = { fetch: async () => new Response("asset", { headers: { "cache-control": "public, max-age=3600" } }) };
  const config = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");
  for (const path of ["/", "/index.html", "/app.js", "/social.css", "/publishers.css"]) assert.match(config, new RegExp(`"${path.replaceAll("/", "\\/")}"`));
  for (const path of ["/", "/index.html", "/app.js?v=20261016-publisher-profiles-r2", "/social.css?v=20261016-publisher-profiles-r2", "/publishers.css?v=20261016-global-publishers-r1"]) {
    const response = await worker.fetch(new Request(`https://mm-voice.test${path}`), { ASSETS });
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.match(response.headers.get("cloudflare-cdn-cache-control") || "", /no-store/);
  }
});
