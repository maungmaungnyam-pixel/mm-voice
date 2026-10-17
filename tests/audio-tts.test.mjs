import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { handleAudioNewsApi } from "../audio-news.mjs";

function makeWav(sampleBytes = new Uint8Array([0, 0])) {
  const output = new Uint8Array(44 + sampleBytes.length);
  const view = new DataView(output.buffer);
  const write = (offset, value) => { for (let i = 0; i < value.length; i++) output[offset + i] = value.charCodeAt(i); };
  write(0, "RIFF"); view.setUint32(4, output.length - 8, true); write(8, "WAVE");
  write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 24000, true); view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, sampleBytes.length, true); output.set(sampleBytes, 44);
  return output;
}

function fakeDb({rows = [], post = null} = {}) {
  return {
    prepare(sql) {
      const statement = {values: [], bind(...values) { statement.values = values; return statement; }};
      statement.all = async () => ({results: rows});
      statement.first = async () => post;
      return statement;
    }
  };
}

const queueRequest = (region) => {
  const url = new URL(`https://mm-voice.test/api/audio/queue?region=${region}`);
  return {url, request: new Request(url)};
};

test("audio queue keeps Burma and Global stories in separate region-scoped queries", async () => {
  const calls = [];
  const DB = {
    prepare(sql) {
      const statement = {values: [], bind(...values) { statement.values = values; return statement; }};
      statement.all = async () => {
        calls.push(sql);
        return {results: [{id: "post-1", title: "Myanmar summary", original_title: "Original headline", source_name: "BBC Burmese", published_at: "2026-10-16T05:00:00.000Z"}]};
      };
      return statement;
    }
  };
  const burma = queueRequest("myanmar");
  const burmaResponse = await handleAudioNewsApi(burma.request, {DB}, burma.url);
  const global = queueRequest("global");
  const globalResponse = await handleAudioNewsApi(global.request, {DB}, global.url);
  assert.equal(burmaResponse.status, 200);
  assert.equal(globalResponse.status, 200);
  assert.match(calls[0], /s\.region = 'myanmar'/);
  assert.match(calls[1], /s\.region = 'global'/);
  assert.equal((await burmaResponse.json()).items[0].title, "Original headline");
  assert.equal((await globalResponse.json()).region, "global");
});

test("TTS reads exact stored original text, preserves chunk order, and returns merged WAV audio", async () => {
  const originalTitle = "မူရင်းခေါင်းစဉ်";
  const originalBody = "ဤသည်မှာ မူရင်းဆောင်းပါးစာသား ဖြစ်သည်။ ".repeat(220);
  const expectedTranscript = `${originalTitle}\n\n${originalBody.trim()}`;
  const requests = [];
  const wav = makeWav(new Uint8Array([1, 0, 2, 0]));
  const encoded = Buffer.from(wav).toString("base64");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    assert.match(String(url), /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    assert.equal(options.headers["x-goog-api-key"], "test-tts-key");
    const payload = JSON.parse(options.body);
    assert.equal(payload.model, "gemini-3.8-flash-tts");
    assert.equal(payload.response_format.type, "audio");
    assert.equal(payload.generation_config.speech_config[0].voice, "Kore");
    requests.push(payload.input[0].content[0].text);
    return Response.json({steps: [{type: "model_output", content: [{type: "audio", data: encoded}]}]});
  };
  try {
    const url = new URL("https://mm-voice.test/api/audio/tts/story-1?region=myanmar");
    const response = await handleAudioNewsApi(new Request(url), {
      DB: fakeDb({post: {
        id: "story-1", type: "news", source_region: "myanmar", source_name: "BBC Burmese",
        original_title: originalTitle, original_body: originalBody, body: "This is an AI summary that must never be read.", source_url: "", source_hosts_json: "[]"
      }}),
      GEMINI_TTS_API_KEY: "test-tts-key"
    }, url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "audio/wav");
    assert.equal(requests.join(""), expectedTranscript);
    const output = new Uint8Array(await response.arrayBuffer());
    assert.equal(String.fromCharCode(...output.slice(0, 4)), "RIFF");
    const view = new DataView(output.buffer, output.byteOffset, output.byteLength);
    assert.equal(view.getUint32(40, true), requests.length * 4);
    assert.deepEqual([...output.slice(44)], Array(requests.length).fill([1, 0, 2, 0]).flat());
  } finally { globalThis.fetch = originalFetch; }
});

test("TTS retries one transient Gemini 5xx response and then returns audio", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const encoded = Buffer.from(makeWav(new Uint8Array([1, 0, 2, 0]))).toString("base64");
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) return new Response("temporary upstream failure", {status: 502});
    return Response.json({steps: [{type: "model_output", content: [{type: "audio", data: encoded}]}]});
  };
  try {
    const url = new URL("https://mm-voice.test/api/audio/tts/story-retry?region=myanmar");
    const response = await handleAudioNewsApi(new Request(url), {
      DB: fakeDb({post: {
        id: "story-retry", type: "news", source_region: "myanmar", source_name: "BBC Burmese",
        original_title: "Original headline", original_body: "Full original article text.", body: "Summary must not be read.", source_url: "", source_hosts_json: "[]"
      }}),
      GEMINI_TTS_API_KEY: "test-tts-key"
    }, url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "audio/wav");
    assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("TTS 429 quota errors expose Retry-After and status without repeating provider requests", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const entries = new Map();
  const memoryCache = {
    async match(key) { const response = entries.get(key.url); return response ? response.clone() : null; },
    async put(key, response) { entries.set(key.url, response.clone()); }
  };
  let calls = 0;
  globalThis.caches = {default: memoryCache};
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify({error: {code: "too_many_requests"}}), {
      status: 429, headers: {"content-type": "application/json", "retry-after": "60044"}
    });
  };
  try {
    const env = {
      DB: fakeDb({post: {
        id: "story-limited", type: "news", source_region: "myanmar", source_name: "BBC Burmese",
        original_title: "Original headline", original_body: "This is the full original article text.", body: "Summary must not be read.", source_url: "", source_hosts_json: "[]"
      }}),
      GEMINI_TTS_API_KEY: "test-tts-key"
    };
    const audioUrl = new URL("https://mm-voice.test/api/audio/tts/story-limited?region=myanmar");
    const response = await handleAudioNewsApi(new Request(audioUrl), env, audioUrl);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "60044");
    assert.equal((await response.json()).error, "tts_rate_limited");

    const statusUrl = new URL("https://mm-voice.test/api/audio/status/story-limited?region=myanmar");
    const status = await handleAudioNewsApi(new Request(statusUrl), env, statusUrl);
    const statusBody = await status.json();
    assert.equal(statusBody.error, "tts_rate_limited");
    assert.ok(statusBody.retryAfterSeconds > 0);

    const quotaUrl = new URL("https://mm-voice.test/api/audio/quota-status");
    const quotaResponse = await handleAudioNewsApi(new Request(quotaUrl), env, quotaUrl);
    const quotaBody = await quotaResponse.json();
    assert.equal(quotaBody.unavailable, true);
    assert.equal(quotaBody.error, "tts_rate_limited");
    assert.ok(quotaBody.retryAfterSeconds > 0);

    const otherArticleUrl = new URL("https://mm-voice.test/api/audio/tts/another-story?region=myanmar");
    const blockedOtherArticle = await handleAudioNewsApi(new Request(otherArticleUrl), env, otherArticleUrl);
    assert.equal(blockedOtherArticle.status, 429);
    assert.equal((await blockedOtherArticle.json()).error, "tts_rate_limited");
    assert.equal(calls, 1);

    const repeated = await handleAudioNewsApi(new Request(audioUrl), env, audioUrl);
    assert.equal(repeated.status, 429);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
  }
});

test("audio route rejects cross-region article requests and does not call Gemini", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("must not synthesize"); };
  try {
    const url = new URL("https://mm-voice.test/api/audio/tts/story-1?region=global");
    const response = await handleAudioNewsApi(new Request(url), {
      DB: fakeDb({post: {id: "story-1", type: "news", source_region: "myanmar", source_name: "BBC Burmese"}}),
      GEMINI_TTS_API_KEY: "test-tts-key"
    }, url);
    assert.equal(response.status, 404);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test("TTS never falls back to a translated summary when original source text cannot be fetched", async () => {
  const originalFetch = globalThis.fetch;
  let geminiCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes("generativelanguage.googleapis.com")) { geminiCalls++; throw new Error("unexpected TTS"); }
    return new Response("forbidden", {status: 403});
  };
  try {
    const url = new URL("https://mm-voice.test/api/audio/tts/story-2?region=myanmar");
    const response = await handleAudioNewsApi(new Request(url), {
      DB: fakeDb({post: {
        id: "story-2", type: "news", source_region: "myanmar", source_name: "BBC Burmese",
        original_title: "Source headline", original_body: "", body: "A translated summary that must not be read.",
        source_url: "https://bbc.com/story", source_hosts_json: '["bbc.com"]'
      }}),
      GEMINI_TTS_API_KEY: "test-tts-key"
    }, url);
    assert.equal(response.status, 422);
    assert.equal(geminiCalls, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test("audio controls and background Media Session support are present in the app shell", async () => {
  const [html, app, styles] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/audio.css", import.meta.url), "utf8")
  ]);
  assert.match(html, /id="drawer-audio-myanmar"/);
  assert.match(html, /id="drawer-audio-global"/);
  assert.match(html, /id="audio-player"[^>]*role="region"/);
  assert.match(html, /id="audio-element"[^>]*playsinline/);
  assert.match(html, /id="audio-volume"[^>]*type="range"/);
  assert.match(html, /id="audio-mute"/);
  assert.match(app, /\['play', toggleAudioPlayback\][\s\S]*\['nexttrack', nextAudioStory\]/);
  assert.match(app, /addEventListener\('ended', nextAudioStory\)/);
  assert.match(app, /addEventListener\('volumechange'/);
  assert.match(app, /\/api\/audio\/status\//);
  assert.match(app, /audioRateLimited/);
  assert.match(app, /\/api\/audio\/queue\?region=/);
  assert.match(app, /\/api\/audio\/tts\//);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /focus-visible/);
});
