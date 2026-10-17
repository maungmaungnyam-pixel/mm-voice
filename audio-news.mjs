import { fetchFullText } from "./news-pipeline.mjs";

const ADMIN_SOURCE_NAME = "MM VOICE Admin";
const TTS_MODEL = "gemini-3.8-flash-tts";
const TTS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/interactions`;
const TTS_MAX_CHARS = 3000;
const MAX_ARTICLE_CHARS = 100000;
const AUDIO_CACHE_TTL_SECONDS = 21600;
const YANGON_OFFSET_MS = 6.5 * 60 * 60 * 1000;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...extraHeaders
    }
  });
}

function audioStatusCacheKey(url, postId, region) {
  return new Request(`${url.origin}/api/audio/status/${encodeURIComponent(postId)}?region=${encodeURIComponent(region)}&v=1`);
}

function audioQuotaStatusCacheKey(url) {
  return new Request(`${url.origin}/api/audio/quota-status?v=1`);
}

async function readCachedAudioStatus(cache, key) {
  if (!cache?.match) return null;
  try {
    const response = await cache.match(key);
    return response ? await response.json() : null;
  } catch { return null; }
}

async function cacheAudioStatus(cache, key, value, ttlSeconds = 300) {
  if (!cache?.put) return;
  const response = new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${Math.max(1, ttlSeconds)}` }
  });
  await cache.put(key, response).catch(() => {});
}

function validRegion(value) {
  return value === "myanmar" || value === "global";
}

function dayBoundsInYangon(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yangon", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const localMidnightAsUtc = Date.parse(`${values.year}-${values.month}-${values.day}T00:00:00.000Z`) - YANGON_OFFSET_MS;
  return {
    start: new Date(localMidnightAsUtc).toISOString(),
    end: new Date(localMidnightAsUtc + 86400000).toISOString()
  };
}

async function getTodaysQueue(env, region) {
  const { start, end } = dayBoundsInYangon();
  const dateExpression = "COALESCE(NULLIF(p.posted_at, ''), p.created_at)";
  const result = region === "global"
    ? await env.DB.prepare(`SELECT p.id, p.title, p.original_title, p.source_name,
        ${dateExpression} AS published_at
      FROM posts p JOIN news_sources s ON s.source_name = p.source_name
      WHERE p.type = 'news' AND s.region = 'global' AND s.enabled = 1
        AND ${dateExpression} >= ? AND ${dateExpression} < ?
      ORDER BY ${dateExpression} DESC, p.id DESC LIMIT 150`).bind(start, end).all()
    : await env.DB.prepare(`SELECT p.id, p.title, p.original_title, p.source_name,
        ${dateExpression} AS published_at
      FROM posts p LEFT JOIN news_sources s ON s.source_name = p.source_name
      WHERE p.type = 'news' AND ((s.region = 'myanmar' AND s.enabled = 1) OR p.source_name = ?)
        AND ${dateExpression} >= ? AND ${dateExpression} < ?
      ORDER BY ${dateExpression} DESC, p.id DESC LIMIT 150`).bind(ADMIN_SOURCE_NAME, start, end).all();
  const items = result.results || [];
  return items.map((row) => ({
    id: row.id,
    title: row.original_title || row.title,
    sourceName: row.source_name,
    publishedAt: row.published_at || ""
  }));
}

function splitExactText(text, limit = TTS_MAX_CHARS) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + limit, text.length);
    if (end < text.length) {
      const newline = text.lastIndexOf("\n", end);
      const space = text.lastIndexOf(" ", end);
      const boundary = Math.max(newline, space);
      if (boundary > start + Math.floor(limit * 0.6)) end = boundary + 1;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

function audioDataFromResponse(payload) {
  if (typeof payload?.output_audio?.data === "string") return payload.output_audio.data;
  const blocks = (payload?.steps || []).flatMap((step) => step?.content || []).filter((part) => part?.type === "audio" && typeof part.data === "string");
  return blocks.at(-1)?.data || "";
}

async function generateSpeechChunk(text, apiKey) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model: TTS_MODEL,
          input: [{
            type: "user_input",
            content: [{
              type: "text",
              text,
              annotations: [{
                type: "speech_metadata",
                style: "Read the supplied text verbatim in clear, natural Burmese with accurate Burmese tones and crisp consonants. Use a calm, warm, unhurried newsreader delivery at a steady volume. Do not translate, summarize, omit, reorder, or add words. If the text is English, read it in clear neutral English."
              }]
            }]
          }],
          response_format: { type: "audio" },
          generation_config: { speech_config: [{ voice: "Kore" }] }
        }),
        signal: AbortSignal.timeout(25000)
      });
    } catch (error) {
      if (attempt === 0 && error?.name === "TypeError") {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      throw error;
    }
    if (!response.ok) {
      if (attempt === 0 && response.status >= 500 && response.status < 600) {
        await response.arrayBuffer().catch(() => {});
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      const error = new Error(`gemini_tts_http_${response.status}`);
      error.status = response.status;
      const retryAfter = Number(response.headers.get("retry-after"));
      if (Number.isFinite(retryAfter) && retryAfter > 0) error.retryAfterSeconds = retryAfter;
      throw error;
    }
    const payload = await response.json();
    const encoded = audioDataFromResponse(payload);
    if (!encoded) throw new Error("gemini_tts_audio_missing");
    const binary = atob(encoded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
  throw new Error("gemini_tts_unavailable_after_retry");
}

function parseWav(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 44) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset, count) => String.fromCharCode(...bytes.subarray(offset, offset + count));
  if (ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WAVE") return null;
  let format = null;
  const data = [];
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const tag = ascii(offset, 4);
    const length = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    if (end > bytes.length) return null;
    if (tag === "fmt ") format = bytes.slice(start, end);
    if (tag === "data") data.push(bytes.slice(start, end));
    offset = end + (length & 1);
  }
  if (!format || !data.length) return null;
  return { format, data };
}

export function mergeWavChunks(chunks) {
  if (!Array.isArray(chunks) || !chunks.length) return null;
  if (chunks.length === 1) return chunks[0];
  const parsed = chunks.map(parseWav);
  if (parsed.some((item) => !item)) return null;
  const format = parsed[0].format;
  if (parsed.some((item) => item.format.length !== format.length || item.format.some((byte, index) => byte !== format[index]))) return null;
  const dataLength = parsed.reduce((total, item) => total + item.data.reduce((size, block) => size + block.length, 0), 0);
  if (dataLength > 0xffffffff - 64) return null;
  const formatPadding = format.length & 1;
  const dataPadding = dataLength & 1;
  const totalLength = 12 + 8 + format.length + formatPadding + 8 + dataLength + dataPadding;
  const output = new Uint8Array(totalLength);
  const view = new DataView(output.buffer);
  const writeAscii = (offset, value) => { for (let index = 0; index < value.length; index++) output[offset + index] = value.charCodeAt(index); };
  writeAscii(0, "RIFF"); view.setUint32(4, totalLength - 8, true); writeAscii(8, "WAVE");
  writeAscii(12, "fmt "); view.setUint32(16, format.length, true); output.set(format, 20);
  const dataHeader = 20 + format.length + formatPadding;
  writeAscii(dataHeader, "data"); view.setUint32(dataHeader + 4, dataLength, true);
  let cursor = dataHeader + 8;
  for (const item of parsed) for (const block of item.data) { output.set(block, cursor); cursor += block.length; }
  return output;
}

async function loadOriginalText(env, row, region) {
  let text = typeof row.original_body === "string" ? row.original_body.trim() : "";
  if (!text && row.source_name === ADMIN_SOURCE_NAME && region === "myanmar") {
    text = typeof row.body === "string" ? row.body.trim() : "";
  }
  if (!text && row.source_url) {
    let allowedHosts = [];
    try { allowedHosts = JSON.parse(row.source_hosts_json || "[]"); } catch {}
    if (!Array.isArray(allowedHosts) || !allowedHosts.length) return "";
    text = await fetchFullText({
      sourceName: row.source_name,
      description: "",
      sourceUrl: row.source_url,
      allowedHosts
    }, { force: true });
  }
  const body = String(text || "").trim();
  const title = String(row.original_title || "").trim();
  if (!body) return "";
  if (title && !body.toLocaleLowerCase().startsWith(title.toLocaleLowerCase())) return `${title}\n\n${body}`;
  return body;
}

async function serveArticleAudio(request, env, url, postId) {
  const region = url.searchParams.get("region") || "myanmar";
  if (!validRegion(region)) return json({ ok: false, error: "invalid_region" }, 400);
  if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
  if (typeof env.GEMINI_TTS_API_KEY !== "string" || !env.GEMINI_TTS_API_KEY.trim()) return json({ ok: false, error: "tts_not_configured" }, 503);

  const cache = globalThis.caches?.default;
  const cacheKey = new Request(`${url.origin}/api/audio/tts/${encodeURIComponent(postId)}?region=${region}&v=1`);
  const statusKey = audioStatusCacheKey(url, postId, region);
  if (cache?.match) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    const quotaStatus = await readCachedAudioStatus(cache, audioQuotaStatusCacheKey(url));
    if (quotaStatus?.error === "tts_rate_limited" && Number(quotaStatus.retryAt) > Date.now()) {
      const retryAfterSeconds = Math.max(1, Math.ceil((Number(quotaStatus.retryAt) - Date.now()) / 1000));
      return json({ ok: false, error: "tts_rate_limited", retryAfterSeconds }, 429, { "retry-after": String(retryAfterSeconds) });
    }
    const cachedStatus = await readCachedAudioStatus(cache, statusKey);
    if (cachedStatus?.error === "tts_rate_limited" && Number(cachedStatus.retryAt) > Date.now()) {
      const retryAfterSeconds = Math.max(1, Math.ceil((Number(cachedStatus.retryAt) - Date.now()) / 1000));
      return json({ ok: false, error: "tts_rate_limited", retryAfterSeconds }, 429, { "retry-after": String(retryAfterSeconds) });
    }
  }

  const row = await env.DB.prepare(`SELECT p.*, s.region AS source_region, s.hosts_json AS source_hosts_json
    FROM posts p LEFT JOIN news_sources s ON s.source_name = p.source_name
    WHERE p.id = ? AND p.type = 'news' AND (s.enabled = 1 OR p.source_name = ?)`)
    .bind(postId, ADMIN_SOURCE_NAME).first();
  const actualRegion = row?.source_region || (row?.source_name === ADMIN_SOURCE_NAME ? "myanmar" : "");
  if (!row || actualRegion !== region) return json({ ok: false, error: "not_found" }, 404);

  let transcript;
  try { transcript = await loadOriginalText(env, row, region); }
  catch { transcript = ""; }
  if (transcript.length < 40) return json({ ok: false, error: "original_text_unavailable" }, 422);
  if (transcript.length > MAX_ARTICLE_CHARS) return json({ ok: false, error: "article_too_long" }, 413);

  try {
    const chunks = splitExactText(transcript);
    const audioChunks = [];
    for (let start = 0; start < chunks.length; start += 3) {
      const group = await Promise.all(chunks.slice(start, start + 3).map((chunk) => generateSpeechChunk(chunk, env.GEMINI_TTS_API_KEY)));
      audioChunks.push(...group);
    }
    const wav = mergeWavChunks(audioChunks);
    if (!wav) return json({ ok: false, error: "invalid_tts_audio" }, 502);
    const response = new Response(wav, {
      status: 200,
      headers: {
        "content-type": "audio/wav",
        "content-length": String(wav.byteLength),
        "cache-control": `public, max-age=${AUDIO_CACHE_TTL_SECONDS}`,
        "content-disposition": "inline; filename=mm-voice-news.wav",
        "x-content-type-options": "nosniff",
        "accept-ranges": "none"
      }
    });
    if (cache?.put) await cache.put(cacheKey, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    console.log(JSON.stringify({ event: "audio_tts_failed", postId, region, error: String(error?.message || "tts_failed").slice(0, 100) }));
    if (Number(error?.status) === 429) {
      const retryAfterSeconds = Math.max(1, Math.min(86400, Number(error.retryAfterSeconds) || 300));
      const retryAt = Date.now() + retryAfterSeconds * 1000;
      await cacheAudioStatus(cache, statusKey, { error: "tts_rate_limited", retryAt }, Math.min(300, retryAfterSeconds));
      await cacheAudioStatus(cache, audioQuotaStatusCacheKey(url), { error: "tts_rate_limited", retryAt }, retryAfterSeconds);
      return json({ ok: false, error: "tts_rate_limited", retryAfterSeconds }, 429, { "retry-after": String(retryAfterSeconds) });
    }
    return json({ ok: false, error: "tts_generation_failed" }, 502);
  }
}

async function serveAudioStatus(url, postId) {
  const region = url.searchParams.get("region") || "myanmar";
  if (!validRegion(region)) return json({ ok: false, error: "invalid_region" }, 400);
  const cachedStatus = await readCachedAudioStatus(globalThis.caches?.default, audioStatusCacheKey(url, postId, region));
  if (cachedStatus?.error === "tts_rate_limited" && Number(cachedStatus.retryAt) > Date.now()) {
    const retryAfterSeconds = Math.max(1, Math.ceil((Number(cachedStatus.retryAt) - Date.now()) / 1000));
    return json({ ok: false, error: "tts_rate_limited", retryAfterSeconds });
  }
  return json({ ok: true, error: null });
}

async function serveAudioQuotaStatus(url) {
  const cachedStatus = await readCachedAudioStatus(globalThis.caches?.default, audioQuotaStatusCacheKey(url));
  if (cachedStatus?.error === "tts_rate_limited" && Number(cachedStatus.retryAt) > Date.now()) {
    const retryAfterSeconds = Math.max(1, Math.ceil((Number(cachedStatus.retryAt) - Date.now()) / 1000));
    return json({ ok: true, unavailable: true, error: "tts_rate_limited", retryAfterSeconds });
  }
  return json({ ok: true, unavailable: false, error: null });
}

export async function handleAudioNewsApi(request, env, url) {
  if (request.method === "GET" && url.pathname === "/api/audio/queue") {
    const region = url.searchParams.get("region") || "myanmar";
    if (!validRegion(region)) return json({ ok: false, error: "invalid_region", items: [] }, 400);
    if (!env.DB) return json({ ok: false, error: "database_not_configured", items: [] }, 503);
    try {
      const items = await getTodaysQueue(env, region);
      return json({ ok: true, region, items });
    } catch {
      return json({ ok: false, error: "audio_queue_unavailable", items: [] }, 503);
    }
  }
  if (request.method === "GET" && url.pathname === "/api/audio/quota-status") return serveAudioQuotaStatus(url);
  const statusMatch = url.pathname.match(/^\/api\/audio\/status\/([A-Za-z0-9_-]{1,100})$/);
  if (request.method === "GET" && statusMatch) return serveAudioStatus(url, statusMatch[1]);
  const match = url.pathname.match(/^\/api\/audio\/tts\/([A-Za-z0-9_-]{1,100})$/);
  if (request.method === "GET" && match) return serveArticleAudio(request, env, url, match[1]);
  return null;
}
