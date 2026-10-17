import test from "node:test";
import assert from "node:assert/strict";
import { MYANMAR_NEWS_SOURCES, RSS_SOURCES } from "../news-pipeline.mjs";

test("MM VOICE ingests only the configured Myanmar-focused publishers", () => {
  assert.deepEqual(MYANMAR_NEWS_SOURCES, [
    "BBC Burmese",
    "Radio Free Asia Burmese",
    "VOA Burmese",
    "Democratic Voice of Burma",
    "Myanmar Now",
    "The Irrawaddy Burmese"
  ]);
  assert.equal(RSS_SOURCES.length, MYANMAR_NEWS_SOURCES.length);
  for (const source of RSS_SOURCES) {
    assert.equal(source.region, "myanmar");
    assert.ok(MYANMAR_NEWS_SOURCES.includes(source.name));
    assert.match(new URL(source.feedUrl).protocol, /^https:$/);
    assert.doesNotMatch(source.feedUrl, /thailand\.prd\.go\.th|bangkokpost|khaosodenglish|tmd\.go\.th/i);
  }
});
