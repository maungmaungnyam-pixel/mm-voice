import test from "node:test";
import assert from "node:assert/strict";
import { canonicalMediaUrl, canonicalVideoUrl, extractArticleVideo, fetchFullText, parseRssItems } from "../news-pipeline.mjs";

const bbcSource = {
  name: "BBC Burmese",
  region: "myanmar",
  feedUrl: "https://feeds.bbci.co.uk/burmese/rss.xml",
  hosts: ["bbci.co.uk", "bbc.co.uk", "bbc.com"]
};

function feedItem(media = "", sourceUrl = "https://www.bbc.com/burmese/articles/example") {
  return `<rss><channel><item><title>Myanmar news story headline</title><link>${sourceUrl}</link><description><![CDATA[<p>A short description of this Myanmar story.</p>]]></description><pubDate>Wed, 14 Oct 2026 10:00:00 GMT</pubDate>${media}</item></channel></rss>`;
}

test("BBC Burmese RSS thumbnail is retained and classified as Myanmar news", () => {
  const items = parseRssItems(feedItem('<media:thumbnail url="https://ichef.bbci.co.uk/ace/cpsprodpb/cover.jpg" width="800" height="450"/>'), bbcSource);
  assert.equal(items.length, 1);
  assert.equal(items[0].region, "myanmar");
  assert.equal(items[0].imageUrl, "https://ichef.bbci.co.uk/ace/cpsprodpb/cover.jpg");
  assert.equal(items[0].videoUrl, "");
});

test("RFA media image URL is decoded and kept from a trusted subdomain", () => {
  const source = { name: "Radio Free Asia Burmese", region: "myanmar", feedUrl: "https://www.rfa.org/burmese/rss2.xml", hosts: ["rfa.org"] };
  const items = parseRssItems(feedItem('<media:content url="https://www.rfa.org/resizer/v2/story.jpg?auth=token&amp;width=1200" type="image/jpeg"/>', "https://www.rfa.org/burmese/news/example"), source);
  assert.equal(items[0].imageUrl, "https://www.rfa.org/resizer/v2/story.jpg?auth=token&width=1200");
});

test("direct publisher video enclosure is exposed for rendering", () => {
  const source = { name: "Democratic Voice of Burma", region: "myanmar", feedUrl: "https://english.dvb.no/feed/", hosts: ["dvb.no"] };
  const items = parseRssItems(feedItem('<enclosure url="https://media.dvb.no/reports/clip.mp4" type="video/mp4"/>', "https://english.dvb.no/reports/example"), source);
  assert.equal(items[0].videoUrl, "https://media.dvb.no/reports/clip.mp4");
});

test("publisher RSS YouTube video is normalized to a privacy-enhanced embed URL", () => {
  const source = { name: "BBC Burmese", region: "myanmar", feedUrl: "https://feeds.bbci.co.uk/burmese/rss.xml", hosts: ["bbc.co.uk", "bbc.com", "bbci.co.uk"] };
  const items = parseRssItems(feedItem('<media:content url="https://www.youtube.com/watch?v=AbCdEfGh123" medium="video"/>'), source);
  assert.equal(items[0].videoUrl, "https://www.youtube-nocookie.com/embed/AbCdEfGh123?rel=0");
});

test("media on unrelated hosts is rejected", () => {
  const items = parseRssItems(feedItem('<media:thumbnail url="https://unrelated.example/cover.jpg"/><media:content url="https://unrelated.example/clip.mp4" type="video/mp4"/>'), bbcSource);
  assert.equal(items[0].imageUrl, "");
  assert.equal(items[0].videoUrl, "");
});

test("article JSON-LD direct video is extracted from an approved publisher host", () => {
  const candidate = { sourceUrl: "https://www.rfa.org/burmese/news/story", allowedHosts: ["rfa.org"] };
  const html = '<script type="application/ld+json">{"@type":"VideoObject","contentUrl":"https://media.rfa.org/burmese/clip.webm"}</script>';
  assert.equal(extractArticleVideo(html, candidate), "https://media.rfa.org/burmese/clip.webm");
});

test("article YouTube embeds are normalized to the privacy-enhanced player", () => {
  const candidate = { sourceUrl: "https://www.rfa.org/burmese/news/story", allowedHosts: ["rfa.org"] };
  const html = '<meta property="og:video" content="https://www.youtube.com/embed/AbCdEfGh123">';
  assert.equal(extractArticleVideo(html, candidate), "https://www.youtube-nocookie.com/embed/AbCdEfGh123?rel=0");
});

test("publisher article Vimeo iframe is exposed as an embeddable player", () => {
  const candidate = { sourceUrl: "https://www.rfa.org/burmese/news/story", allowedHosts: ["rfa.org"] };
  const html = '<iframe src="https://player.vimeo.com/video/123456789"></iframe>';
  assert.equal(extractArticleVideo(html, candidate), "https://player.vimeo.com/video/123456789?dnt=1");
});

test("video embeds from unapproved hosts and lookalike provider domains are rejected", () => {
  const candidate = { sourceUrl: "https://www.rfa.org/burmese/news/story", allowedHosts: ["rfa.org"] };
  assert.equal(extractArticleVideo('<iframe src="https://video.example/embed/AbCdEfGh123"></iframe>', candidate), "");
  assert.equal(extractArticleVideo('<iframe src="https://youtube.com.evil.example/embed/AbCdEfGh123"></iframe>', candidate), "");
});

test("empty media fields stay empty instead of becoming publisher article URLs", () => {
  assert.equal(canonicalMediaUrl("", "https://www.bbc.com/story.jpg", ["bbc.com"]), "");
  assert.equal(canonicalVideoUrl("", "https://www.bbc.com/story.mp4", ["bbc.com"]), "");
});

test("article video extraction follows redirects only within configured publisher hosts", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (address) => {
    calls.push(String(address));
    if (calls.length === 1) return new Response(null, { status: 301, headers: { location: "/canonical/story" } });
    return new Response('<meta property="og:video" content="https://www.youtube.com/embed/AbCdEfGh123">', { status: 200, headers: { "content-type": "text/html" } });
  };
  const candidate = { sourceUrl: "https://www.rfa.org/burmese/story", description: "short", allowedHosts: ["rfa.org"], videoUrl: "" };
  try {
    await fetchFullText(candidate);
    assert.deepEqual(calls, ["https://www.rfa.org/burmese/story", "https://www.rfa.org/canonical/story"]);
    assert.equal(candidate.videoUrl, "https://www.youtube-nocookie.com/embed/AbCdEfGh123?rel=0");
  } finally { globalThis.fetch = originalFetch; }
});

test("article fetch refuses off-publisher redirects unless the destination is a recognized video", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (address) => {
    calls.push(String(address));
    return new Response(null, { status: 302, headers: { location: "https://untrusted.example/article" } });
  };
  const candidate = { sourceUrl: "https://www.rfa.org/burmese/story", description: "short", allowedHosts: ["rfa.org"], videoUrl: "" };
  try {
    await fetchFullText(candidate);
    assert.deepEqual(calls, ["https://www.rfa.org/burmese/story"]);
    assert.equal(candidate.videoUrl, "");
  } finally { globalThis.fetch = originalFetch; }
});
