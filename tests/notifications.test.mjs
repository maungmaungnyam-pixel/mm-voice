import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.mjs";
import { classifyNotification, MYANMAR_NEWS_SOURCES } from "../news-pipeline.mjs";

test("weather notifications require an explicit weather emergency or warning headline", () => {
  assert.equal(classifyNotification({ sourceName: "Myanmar Now", title: "Urgent weather warning: heavy rain and high waves in Rakhine" }), "weather");
  assert.equal(classifyNotification({ sourceName: "BBC Burmese", title: "အရေးပေါ် မိုးသည်းထန်ပြီး ရေကြီးနိုင်သည်" }), "weather");
  assert.equal(classifyNotification({ sourceName: "Myanmar Now", title: "Residents prepare for heavy rain during monsoon season" }), "");
});

test("only explicit high-impact events become breaking notifications", () => {
  assert.equal(classifyNotification({ sourceName: "Democratic Voice of Burma", title: "Breaking News: Major explosion in Myanmar" }), "breaking");
  assert.equal(classifyNotification({ sourceName: "Radio Free Asia Burmese", title: "ငလျင် သတိပေးချက်" }), "breaking");
  assert.equal(classifyNotification({ sourceName: "Myanmar Now", title: "Officials review damage from last year's earthquake" }), "");
  assert.equal(classifyNotification({ sourceName: "BBC Burmese", title: "A warning sign is added near a road" }), "");
});

test("routine stories do not generate alert notifications", () => {
  assert.equal(classifyNotification({ sourceName: "Myanmar Now", title: "Community festival opens this weekend" }), "");
  assert.equal(classifyNotification({ sourceName: "Myanmar Now", title: "City prepares for a routine traffic change", description: "An emergency alert was mentioned in an unrelated past story." }), "");
});

test("GET /api/notifications returns only configured Myanmar publishers", async () => {
  let query = "";
  let boundValues = [];
  const row = {
    notification_id: "notice-a",
    kind: "weather",
    notification_created_at: "2026-10-15T00:00:00.000Z",
    id: "feed-a",
    type: "news",
    title: "မိုးသည်းထန်မည်",
    category: "သတင်း",
    image_url: "",
    body: "မိုးလေဝသ သတိပေးချက်။",
    source_name: "BBC Burmese",
    source_url: "https://www.bbc.com/burmese/articles/test",
    location: "",
    salary: "",
    phone: "",
    line_id: "",
    created_at: "2026-10-14T23:50:00.000Z",
    updated_at: "2026-10-15T00:00:00.000Z",
    original_title: "Heavy Rain",
    view_count: 0
  };
  const DB = {
    prepare(sql) {
      query = sql;
      return {
        bind(...values) { boundValues = values; return this; },
        async all() { return { results: [row] }; }
      };
    }
  };
  const response = await worker.fetch(new Request("https://mm-voice.test/api/notifications?limit=100"), { DB });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].kind, "weather");
  assert.equal(body.items[0].id, "feed-a");
  assert.equal(body.items[0].postKey, "feed-a");
  assert.equal(body.items[0].notificationId, "notice-a");
  assert.match(query, /FROM notifications n JOIN posts p/);
  assert.match(query, /p\.source_name IN/);
  assert.match(query, /news_sources WHERE region='myanmar' AND enabled=1/);
  assert.deepEqual(boundValues, [50]);
});

test("GET /api/posts includes MM VOICE news sources and disables jobs", async () => {
  let query = "";
  let boundValues = [];
  const DB = {
    prepare(sql) {
      query = sql;
      return {
        bind(...values) { boundValues = values; return this; },
        async all() { return { results: [] }; }
      };
    }
  };
  const newsResponse = await worker.fetch(new Request("https://mm-voice.test/api/posts?type=news"), { DB });
  assert.equal(newsResponse.status, 200);
  assert.match(query, /source_name IN/);
  assert.match(query, /news_sources WHERE region='myanmar' AND enabled=1/);
  assert.deepEqual(boundValues, ["news", "MM VOICE Admin"]);
  const jobsResponse = await worker.fetch(new Request("https://mm-voice.test/api/posts?type=jobs"), { DB });
  assert.deepEqual((await jobsResponse.json()).items, []);
});

test("GET /api/updates cannot expose the legacy Thai feed", async () => {
  const response = await worker.fetch(new Request("https://mm-voice.test/api/updates"), {});
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).items, []);
});

test("GET /api/notifications reports missing database configuration", async () => {
  const response = await worker.fetch(new Request("https://mm-voice.test/api/notifications"), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "database_not_configured");
});
