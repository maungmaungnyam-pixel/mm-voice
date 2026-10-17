import { runNewsPipeline } from "./news-pipeline.mjs";
import { handleAudioNewsApi } from "./audio-news.mjs";
import { getAuthenticatedUser, handleAuth } from "./auth.mjs";

const ADMIN_SOURCE_NAME = "MM VOICE Admin";

const CAPACITOR_APP_ORIGINS = new Set(["https://localhost"]);
const API_CORS_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "OPTIONS"]);
const API_CORS_HEADERS = new Set(["content-type", "authorization"]);



function json(data, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer"
    }
  });
}

function isAllowedApiOrigin(origin, url) {
  return Boolean(origin) && (origin === url.origin || CAPACITOR_APP_ORIGINS.has(origin));
}

function corsifyApiResponse(request, url, response) {
  const origin = request.headers.get("origin");
  if (!isAllowedApiOrigin(origin, url)) return response;
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-methods", [...API_CORS_METHODS].join(", "));
  headers.set("access-control-allow-headers", [...API_CORS_HEADERS].join(", "));
  headers.set("access-control-max-age", "600");
  headers.set("vary", headers.has("vary") ? `${headers.get("vary")}, Origin` : "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function apiPreflight(request, url) {
  const origin = request.headers.get("origin");
  if (!isAllowedApiOrigin(origin, url)) return new Response(null, { status: 403 });
  const method = (request.headers.get("access-control-request-method") || "").toUpperCase();
  if (method && !API_CORS_METHODS.has(method)) return new Response(null, { status: 403 });
  const requestedHeaders = (request.headers.get("access-control-request-headers") || "")
    .split(",").map((header) => header.trim().toLowerCase()).filter(Boolean);
  if (requestedHeaders.some((header) => !API_CORS_HEADERS.has(header))) return new Response(null, { status: 403 });
  return corsifyApiResponse(request, url, new Response(null, { status: 204 }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") && request.method === "OPTIONS") return apiPreflight(request, url);
    if (request.method === "GET" && url.pathname === "/api/updates") return corsifyApiResponse(request, url, json({ ok: true, items: [] }, 200, "no-store"));
    if (request.method === "GET" && url.pathname === "/api/health") {
      return corsifyApiResponse(request, url, json({ ok: true, service: "MM VOICE", checkedAt: new Date().toISOString() }, 200, "no-store"));
    }
    const authResponse = await handleAuth(request, env, url);
    if (authResponse) return corsifyApiResponse(request, url, authResponse);
    const apiResponse = await handleDynamicApi(request, env, url);
    if (apiResponse) return corsifyApiResponse(request, url, apiResponse);
    if (request.method === "GET" && (url.pathname === "/admin" || url.pathname === "/admin/")) {
      const adminAsset = await env.ASSETS.fetch(new Request(new URL("/admin-ui.txt", url.origin), { method: "GET", headers: request.headers }));
      const headers = new Headers(adminAsset.headers);
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("cache-control", "no-store");
      return new Response(adminAsset.body, { status: adminAsset.status, headers });
    }
    const assetResponse = await env.ASSETS.fetch(request);
    if (request.method === "GET" && ["/", "/index.html", "/app.js", "/social.css", "/publishers.css", "/sw.js", "/manifest.webmanifest"].includes(url.pathname)) {
      const headers = new Headers(assetResponse.headers);
      const isPwaControlAsset = url.pathname === "/sw.js" || url.pathname === "/manifest.webmanifest";
      headers.set("cache-control", isPwaControlAsset ? "no-cache, no-store, must-revalidate" : "no-store, max-age=0");
      headers.set("cdn-cache-control", "no-store");
      headers.set("cloudflare-cdn-cache-control", "no-store");
      if (url.pathname === "/sw.js") {
        headers.set("content-type", "application/javascript; charset=utf-8");
        headers.set("service-worker-allowed", "/");
      }
      if (url.pathname === "/manifest.webmanifest") headers.set("content-type", "application/manifest+json; charset=utf-8");
      return new Response(assetResponse.body, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
    }
    return assetResponse;
  },
  async scheduled(controller, env, ctx) {
    if (controller.cron !== "* * * * *") return;
    const scheduledMinute = Math.floor(Number(controller.scheduledTime) / 60000);
    const maxSourcesPerRun = 8;
    const processingSlot = ((scheduledMinute % 15) + 15) % 15;
    const processQueue = [0, 4, 8, 12].includes(processingSlot);
    const task = runNewsPipeline(env, { queueMode: true, processQueue, maxSourcesPerRun, maxItemsPerRun: 3 })
      .then((result) => console.log(JSON.stringify({ event: "scheduled_news_completed", scheduledTime: controller.scheduledTime, cron: controller.cron, maxSourcesPerRun, processQueue, processingSlot, ...result })))
      .catch((error) => console.log(JSON.stringify({ event: "scheduled_news_failed", scheduledTime: controller.scheduledTime, error: String(error?.message || "unknown_error").slice(0, 160) })));
    ctx.waitUntil(task);
  }
};


function postFromRow(row) {
  return {
    id: row.id,
    postKey: row.id,
    type: row.type,
    title: row.title,
    category: row.category,
    imageUrl: row.image_url,
    videoUrl: row.video_url || "",
    body: row.body,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    region: row.region || "myanmar",
    companyName: row.company_name || "",
    jobRequirements: row.job_requirements || "",
    contactInfo: row.contact_info || "",
    applicationMethod: row.application_method || "",
    applicationUrl: row.application_url || "",
    postedAt: row.posted_at || "",
    location: row.location,
    salary: row.salary,
    phone: row.phone,
    lineId: row.line_id,
    isVerified: Boolean(row.is_verified),
    verifiedBy: row.verified_by || "",
    verifiedAt: row.verified_at || "",
    isScamAlert: Boolean(row.is_scam_alert),
    originalTitle: row.original_title || "",
    viewCount: Number(row.view_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    publishedAt: row.posted_at || row.created_at
  };
}

function validKey(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
}

function textField(value, maxLength, required = false) {
  if (typeof value !== "string") return required ? null : "";
  const result = value.trim();
  if (result.length > maxLength || (required && !result)) return null;
  return result;
}

function safeWebUrl(value, allowLocalImage = false) {
  if (!value) return true;
  if (allowLocalImage && /^\/images\/[A-Za-z0-9._/-]+$/.test(value)) return true;
  if (allowLocalImage && value.length <= 250000 && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

async function requestJson(request) {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch { return null; }
}

function sameOriginMutation(request, url) {
  return isAllowedApiOrigin(request.headers.get("origin"), url);
}

function communityIdentity(user, visitorId) {
  if (user) return { id: user.id, name: textField(user.name, 100) || "Community member" };
  const value = textField(visitorId, 64, true);
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return null;
  return { id: `guest:${value.toLowerCase()}`, name: "Community member" };
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function adminHmacKey(env) {
  if (typeof env.ADMIN_PASSWORD !== "string" || !env.ADMIN_PASSWORD) return null;
  return crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_PASSWORD), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signAdminSession(env, expiresAt) {
  const key = await adminHmacKey(env);
  if (!key) return null;
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ role: "admin", exp: expiresAt })));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return `${payload}.${base64UrlEncode(signature)}`;
}

function cookieValue(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return "";
}

async function isAdmin(request, env) {
  const token = cookieValue(request, "admin_session");
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  try {
    const key = await adminHmacKey(env);
    if (!key) return false;
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(signature), new TextEncoder().encode(payload));
    if (!valid) return false;
    const session = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    return session.role === "admin" && Number(session.exp) > Date.now();
  } catch { return false; }
}

function adminRequired() {
  return json({ ok: false, error: "admin_auth_required" }, 401);
}

function validAnonymousVisitorId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getEnabledNewsSourceNames(env, region = "myanmar") {
  const query = region === "all"
    ? "SELECT source_name FROM news_sources WHERE enabled = 1 ORDER BY source_name"
    : "SELECT source_name FROM news_sources WHERE region = 'myanmar' AND enabled = 1 ORDER BY source_name";
  const result = await env.DB.prepare(query).all();
  return (result.results || []).map((row) => row.source_name).filter(Boolean);
}

function publicPublisherFromRow(row) {
  const safeFacebookUrl = (value) => {
    if (!safeWebUrl(value)) return "";
    try { return ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com"].includes(new URL(value).hostname.toLowerCase()) ? value : ""; }
    catch { return ""; }
  };
  return {
    sourceName: row.source_name,
    region: row.region,
    websiteUrl: safeWebUrl(row.official_website) ? row.official_website : "",
    facebookUrl: safeFacebookUrl(row.facebook_url)
  };
}

function isMmVoiceNewsPost(row, enabledSourceNames) {
  return Boolean(row && row.type === "news" && (row.source_name === ADMIN_SOURCE_NAME || enabledSourceNames.includes(row.source_name)));
}

function normalizeNewsSourceInput(body) {
  const sourceName = textField(body?.sourceName || body?.name || "", 120, true);
  const feedUrl = textField(body?.feedUrl || "", 2000, true);
  if (!sourceName || sourceName === ADMIN_SOURCE_NAME || /[\u0000-\u001f\u007f]/.test(sourceName) || !feedUrl) return null;
  let url;
  try { url = new URL(feedUrl); } catch { return null; }
  const host = url.hostname.toLowerCase();
  const domainPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !domainPattern.test(host) || /\.(?:local|localhost|internal|test)$/i.test(host)) return null;
  const rawHosts = Array.isArray(body.allowedHosts) ? body.allowedHosts : String(body.allowedHosts || "").split(",");
  const hosts = [...new Set([host, ...rawHosts.map((item) => String(item).trim().toLowerCase().replace(/^www\./, "")).filter(Boolean)])];
  if (hosts.length > 10 || hosts.some((item) => !domainPattern.test(item) || /\.(?:local|localhost|internal|test)$/i.test(item))) return null;
  url.hash = "";
  return { sourceName, feedUrl: url.href, hosts };
}

function myanmarDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function recordAnonymousActivity(env, visitorId, kind, isVisit = false) {
  if (!validAnonymousVisitorId(visitorId)) return false;
  try {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(visitorId.toLowerCase())));
    const visitorHash = base64UrlEncode(digest);
    const now = new Date().toISOString();
    const day = myanmarDayKey();
    const firstActivityToday = await env.DB.prepare(
      "INSERT OR IGNORE INTO analytics_visitor_days (visitor_hash, day, last_seen_at) VALUES (?, ?, ?)"
    ).bind(visitorHash, day, now).run();
    const isFirstActivityToday = Number(firstActivityToday?.meta?.changes || 0) > 0;
    const counts = {
      visits: kind === "visit" && isVisit ? 1 : 0,
      postViews: kind === "post_view" ? 1 : 0,
      likes: kind === "like" ? 1 : 0,
      comments: kind === "comment" ? 1 : 0
    };
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO analytics_visitors
        (visitor_hash, first_seen_at, last_seen_at, total_visits, active_days, post_views, likes, comments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(visitor_hash) DO UPDATE SET
          last_seen_at=excluded.last_seen_at,
          total_visits=analytics_visitors.total_visits + excluded.total_visits,
          active_days=analytics_visitors.active_days + excluded.active_days,
          post_views=analytics_visitors.post_views + excluded.post_views,
          likes=analytics_visitors.likes + excluded.likes,
          comments=analytics_visitors.comments + excluded.comments`)
        .bind(visitorHash, now, now, counts.visits, isFirstActivityToday ? 1 : 0, counts.postViews, counts.likes, counts.comments),
      env.DB.prepare(`UPDATE analytics_visitor_days SET
        visits=visits + ?, post_views=post_views + ?, likes=likes + ?, comments=comments + ?, last_seen_at=?
        WHERE visitor_hash=? AND day=?`)
        .bind(counts.visits, counts.postViews, counts.likes, counts.comments, now, visitorHash, day)
    ]);
    await env.DB.prepare(`INSERT INTO app_analytics_daily (day, total_visits, daily_active_users) VALUES (?, ?, ?)
      ON CONFLICT(day) DO UPDATE SET total_visits=total_visits + excluded.total_visits,
      daily_active_users=daily_active_users + excluded.daily_active_users`)
      .bind(day, counts.visits, isFirstActivityToday ? 1 : 0).run();
    return true;
  } catch {
    console.log(JSON.stringify({ event: "anonymous_analytics_write_failed", kind }));
    return false;
  }
}

async function handleAdmin(request, env, url) {
  if (url.pathname === "/api/admin/analytics" && request.method === "GET") {
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    try {
      const day = myanmarDayKey();
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [today, active, total, recent, visitorSummary, topVisitors, topPosts] = await Promise.all([
        env.DB.prepare("SELECT total_visits, daily_active_users FROM app_analytics_daily WHERE day = ?").bind(day).first(),
        env.DB.prepare("SELECT COUNT(*) AS count FROM analytics_visitor_days WHERE day = ?").bind(day).first(),
        env.DB.prepare("SELECT COALESCE(SUM(total_visits), 0) AS total_visits FROM app_analytics_daily").first(),
        env.DB.prepare(`SELECT day, total_visits,
          COALESCE((SELECT COUNT(*) FROM analytics_visitor_days v WHERE v.day = d.day), daily_active_users) AS daily_active_users
          FROM app_analytics_daily d ORDER BY day DESC LIMIT 14`).all(),
        env.DB.prepare(`SELECT COUNT(*) AS total_visitors,
          SUM(CASE WHEN last_seen_at >= ? AND active_days >= 2 THEN 1 ELSE 0 END) AS returning_visitors_30d,
          SUM(CASE WHEN last_seen_at >= ? AND (active_days >= 3 OR total_visits >= 3 OR post_views >= 5 OR likes + comments >= 2) THEN 1 ELSE 0 END) AS engaged_visitors_30d
          FROM analytics_visitors`).bind(since, since).first(),
        env.DB.prepare(`SELECT substr(visitor_hash, 1, 8) AS anon_id, first_seen_at, last_seen_at,
          total_visits, active_days, post_views, likes, comments
          FROM analytics_visitors WHERE last_seen_at >= ?
          ORDER BY (active_days * 4 + total_visits * 2 + post_views + (likes + comments) * 3) DESC, last_seen_at DESC LIMIT 12`).bind(since).all(),
        env.DB.prepare(`SELECT p.id, p.title, p.view_count,
          (SELECT COUNT(*) FROM likes l WHERE l.post_key = p.id) AS likes,
          (SELECT COUNT(*) FROM comments c WHERE c.post_key = p.id) AS comments
          FROM posts p WHERE p.type = 'news' AND (p.source_name IN (SELECT source_name FROM news_sources WHERE region='myanmar' AND enabled=1) OR p.source_name = ?)
          ORDER BY p.view_count DESC, likes DESC, comments DESC, p.created_at DESC LIMIT 8`).bind(ADMIN_SOURCE_NAME).all()
      ]);
      return json({
        ok: true, day,
        todayVisits: Number(today?.total_visits || 0),
        dailyActiveUsers: Number(active?.count || 0),
        totalVisits: Number(total?.total_visits || 0),
        totalVisitors: Number(visitorSummary?.total_visitors || 0),
        returningVisitors30d: Number(visitorSummary?.returning_visitors_30d || 0),
        engagedVisitors30d: Number(visitorSummary?.engaged_visitors_30d || 0),
        recent: (recent.results || []).map((row) => ({ day: row.day, visits: Number(row.total_visits || 0), dailyActiveUsers: Number(row.daily_active_users || 0) })),
        topVisitors: (topVisitors.results || []).map((row) => ({ id: row.anon_id, firstSeenAt: row.first_seen_at, lastSeenAt: row.last_seen_at, visits: Number(row.total_visits || 0), activeDays: Number(row.active_days || 0), postViews: Number(row.post_views || 0), likes: Number(row.likes || 0), comments: Number(row.comments || 0) })),
        topPosts: (topPosts.results || []).map((row) => ({ id: row.id, title: row.title, views: Number(row.view_count || 0), likes: Number(row.likes || 0), comments: Number(row.comments || 0) }))
      }, 200, "no-store");
    } catch {
      return json({ ok: false, error: "analytics_unavailable" }, 503);
    }
  }
  if (url.pathname === "/api/admin/news/sources" && request.method === "GET") {
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const result = await env.DB.prepare(`SELECT s.source_name,s.feed_url,s.hosts_json,s.enabled,s.created_at,s.updated_at,
      COALESCE(state.last_checked_at,'') AS last_checked_at,COALESCE(state.last_success_at,'') AS last_success_at,
      COALESCE(state.last_status,'pending') AS last_status,COALESCE(state.items_seen,0) AS items_seen,COALESCE(state.last_error,'') AS last_error,
      (SELECT COUNT(*) FROM posts p WHERE p.type='news' AND p.source_name=s.source_name) AS story_count
      FROM news_sources s LEFT JOIN news_sync_state state ON state.source_name=s.source_name
      WHERE s.region='myanmar' ORDER BY s.enabled DESC,s.source_name COLLATE NOCASE`).all();
    const items = (result.results || []).map((row) => {
      let allowedHosts = [];
      try { allowedHosts = JSON.parse(row.hosts_json || "[]"); } catch {}
      return { sourceName: row.source_name, feedUrl: row.feed_url, allowedHosts: Array.isArray(allowedHosts) ? allowedHosts : [], enabled: Boolean(Number(row.enabled)), createdAt: row.created_at, updatedAt: row.updated_at, lastCheckedAt: row.last_checked_at, lastSuccessAt: row.last_success_at, lastStatus: row.last_status, itemsSeen: Number(row.items_seen || 0), lastError: row.last_error, storyCount: Number(row.story_count || 0) };
    });
    return json({ ok: true, items }, 200, "no-store");
  }
  if (url.pathname === "/api/admin/news/sources" && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const source = normalizeNewsSourceInput(await requestJson(request));
    if (!source) return json({ ok: false, error: "invalid_news_source" }, 400);
    const now = new Date().toISOString();
    try {
      await env.DB.prepare("INSERT INTO news_sources (source_name,feed_url,hosts_json,region,enabled,created_at,updated_at) VALUES (?,?,?,'myanmar',1,?,?)")
        .bind(source.sourceName, source.feedUrl, JSON.stringify(source.hosts), now, now).run();
    } catch (error) {
      if (/unique|constraint/i.test(String(error?.message || ""))) return json({ ok: false, error: "news_source_already_exists" }, 409);
      return json({ ok: false, error: "news_source_save_failed" }, 503);
    }
    return json({ ok: true, source: { sourceName: source.sourceName, feedUrl: source.feedUrl, allowedHosts: source.hosts, enabled: true } }, 201);
  }
  const sourceMatch = url.pathname.match(/^\/api\/admin\/news\/sources\/([^/]+)$/);
  if (sourceMatch && request.method === "PUT") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const body = await requestJson(request);
    if (typeof body?.enabled !== "boolean") return json({ ok: false, error: "invalid_enabled_value" }, 400);
    let sourceName;
    try { sourceName = decodeURIComponent(sourceMatch[1]); } catch { return json({ ok: false, error: "invalid_news_source" }, 400); }
    const result = await env.DB.prepare("UPDATE news_sources SET enabled=?,updated_at=? WHERE source_name=? AND region='myanmar'")
      .bind(body.enabled ? 1 : 0, new Date().toISOString(), sourceName).run();
    if (!Number(result?.meta?.changes || 0)) return json({ ok: false, error: "news_source_not_found" }, 404);
    return json({ ok: true, sourceName, enabled: body.enabled });
  }
  if (url.pathname === "/api/admin/news/sync" && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    let body;
    if (contentType.startsWith("application/x-www-form-urlencoded") || contentType.startsWith("multipart/form-data")) {
      const form = await request.formData();
      body = { sourceNames: form.getAll("sourceNames"), publishedFrom: form.get("publishedFrom"), publishedBefore: form.get("publishedBefore") };
      if (form.has("maxItemsPerRun")) body.maxItemsPerRun = Number(form.get("maxItemsPerRun"));
    } else body = await requestJson(request) || {};
    const options = {};
    if (body.sourceNames !== undefined) {
      if (!Array.isArray(body.sourceNames) || body.sourceNames.length > 30 || body.sourceNames.some((name) => typeof name !== "string" || !name.trim() || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name))) {
        return json({ ok: false, error: "invalid_source_scope" }, 400);
      }
      options.sourceNames = [...new Set(body.sourceNames)];
    }
    const hasPublishedWindow = body.publishedFrom !== undefined || body.publishedBefore !== undefined;
    if (hasPublishedWindow) {
      if (typeof body.publishedFrom !== "string" || typeof body.publishedBefore !== "string") return json({ ok: false, error: "invalid_published_window" }, 400);
      const publishedFrom = Date.parse(body.publishedFrom), publishedBefore = Date.parse(body.publishedBefore);
      if (!Number.isFinite(publishedFrom) || !Number.isFinite(publishedBefore) || publishedFrom >= publishedBefore) return json({ ok: false, error: "invalid_published_window" }, 400);
      options.publishedFrom = body.publishedFrom;
      options.publishedBefore = body.publishedBefore;
    }
    if (body.maxItemsPerRun !== undefined) {
      const maxItemsPerRun = typeof body.maxItemsPerRun === "number" ? body.maxItemsPerRun : Number(body.maxItemsPerRun);
      if (!Number.isInteger(maxItemsPerRun) || maxItemsPerRun < 1 || maxItemsPerRun > 12) return json({ ok: false, error: "invalid_batch_limit" }, 400);
      options.maxItemsPerRun = maxItemsPerRun;
    }
    const result = await runNewsPipeline(env, options);
    return json(result, result.ok ? 200 : 503);
  }
  if (url.pathname === "/api/admin/jobs/status" && request.method === "GET") {
    if (!await isAdmin(request, env)) return adminRequired();
    return json({ ok: true, intervalHours: 6, sources: [] }, 200, "no-store");
  }
  if (url.pathname === "/api/admin/jobs/sync" && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!await isAdmin(request, env)) return adminRequired();
    return json({ ok: false, error: "news_only_app" }, 410);
  }
  if (url.pathname === "/api/admin/session" && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!env.ADMIN_PASSWORD) return json({ ok: false, error: "admin_not_configured" }, 503);
    const body = await requestJson(request);
    if (!body || typeof body.password !== "string" || body.password !== env.ADMIN_PASSWORD) {
      return json({ ok: false, error: "invalid_password" }, 401);
    }
    const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
    const session = await signAdminSession(env, expiresAt);
    const response = json({ ok: true, expiresAt }, 200, "no-store");
    response.headers.append("set-cookie", `admin_session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`);
    return response;
  }
  if (url.pathname === "/api/admin/session" && request.method === "DELETE") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    const response = json({ ok: true });
    response.headers.append("set-cookie", "admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
    return response;
  }
  if (url.pathname === "/api/admin/posts" && request.method === "GET") {
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const result = await env.DB.prepare(`SELECT * FROM posts WHERE type = 'news' AND (source_name IN (SELECT source_name FROM news_sources WHERE region='myanmar' AND enabled=1) OR source_name = ?) ORDER BY created_at DESC, id DESC LIMIT 200`).bind(ADMIN_SOURCE_NAME).all();
    return json({ ok: true, items: (result.results || []).map(postFromRow) });
  }
  if (url.pathname === "/api/admin/posts" && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const body = await requestJson(request);
    const post = parseAdminPost(body);
    if (!post) return json({ ok: false, error: "invalid_fields_or_too_long" }, 400);
    const enabledSources = await getEnabledNewsSourceNames(env);
    if (post.type !== "news" || (post.sourceName !== ADMIN_SOURCE_NAME && !enabledSources.includes(post.sourceName))) return json({ ok: false, error: "mm_voice_news_source_required" }, 400);
    if (!safeWebUrl(post.imageUrl, true) || !safeWebUrl(post.sourceUrl)) return json({ ok: false, error: "https_urls_required" }, 400);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const verifiedAt = post.isVerified ? createdAt : "";
    await env.DB.prepare("INSERT INTO posts (id,type,title,category,image_url,body,source_name,source_url,location,salary,phone,line_id,is_verified,verified_by,verified_at,is_scam_alert,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id, post.type, post.title, post.category || "General", post.imageUrl, post.body, post.sourceName, post.sourceUrl, post.location, post.salary, post.phone, post.lineId, post.isVerified ? 1 : 0, post.isVerified ? "MM VOICE Admin" : "", verifiedAt, post.isScamAlert ? 1 : 0, createdAt, createdAt).run();
    const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();
    return json({ ok: true, item: postFromRow(row) }, 201);
  }
  const updateMatch = url.pathname.match(/^\/api\/admin\/posts\/([A-Za-z0-9_-]{1,100})$/);
  if (updateMatch && request.method === "PUT") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const body = await requestJson(request);
    const post = parseAdminPost(body);
    if (!post) return json({ ok: false, error: "invalid_fields_or_too_long" }, 400);
    const enabledSources = await getEnabledNewsSourceNames(env);
    if (post.type !== "news" || (post.sourceName !== ADMIN_SOURCE_NAME && !enabledSources.includes(post.sourceName))) return json({ ok: false, error: "mm_voice_news_source_required" }, 400);
    if (!safeWebUrl(post.imageUrl, true) || !safeWebUrl(post.sourceUrl)) return json({ ok: false, error: "https_urls_required" }, 400);
    const id = updateMatch[1];
    const existing = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();
    if (!isMmVoiceNewsPost(existing, enabledSources)) return json({ ok: false, error: "not_found" }, 404);
    const updatedAt = new Date().toISOString();
    const verifiedAt = post.isVerified ? (existing.verified_at || updatedAt) : "";
    await env.DB.prepare("UPDATE posts SET type=?,title=?,category=?,image_url=?,body=?,source_name=?,source_url=?,location=?,salary=?,phone=?,line_id=?,is_verified=?,verified_by=?,verified_at=?,is_scam_alert=?,updated_at=? WHERE id=?")
      .bind(post.type, post.title, post.category || "General", post.imageUrl, post.body, post.sourceName, post.sourceUrl, post.location, post.salary, post.phone, post.lineId, post.isVerified ? 1 : 0, post.isVerified ? "MM VOICE Admin" : "", verifiedAt, post.isScamAlert ? 1 : 0, updatedAt, id).run();
    const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();
    return json({ ok: true, item: postFromRow(row) });
  }
  const deleteMatch = url.pathname.match(/^\/api\/admin\/posts\/([A-Za-z0-9_-]{1,100})$/);
  if (deleteMatch && request.method === "DELETE") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!await isAdmin(request, env)) return adminRequired();
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const id = deleteMatch[1];
    const existing = await env.DB.prepare("SELECT type, source_name, source_url FROM posts WHERE id = ?").bind(id).first();
    const enabledSources = await getEnabledNewsSourceNames(env);
    if (!isMmVoiceNewsPost(existing, enabledSources)) return json({ ok: false, error: "not_found" }, 404);
    const statements = [
      env.DB.prepare("DELETE FROM comments WHERE post_key = ?").bind(id),
      env.DB.prepare("DELETE FROM likes WHERE post_key = ?").bind(id),
      env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id)
    ];
    if (existing.source_name !== ADMIN_SOURCE_NAME && existing.source_url) {
      statements.unshift(env.DB.prepare("INSERT OR IGNORE INTO admin_post_suppressions (source_url, deleted_at) VALUES (?, ?)").bind(existing.source_url, new Date().toISOString()));
    }
    await env.DB.batch(statements);
    return json({ ok: true, id });
  }
  return json({ ok: false, error: "not_found" }, 404);
}

function parseAdminPost(body) {
  if (!body || body.type !== "news") return null;
  const title = textField(body.title, 180, true);
  const category = textField(body.category || "", 80);
  const imageUrl = textField(body.imageUrl || "", 250000);
  const text = textField(body.body, 30000, true);
  const sourceName = textField(body.sourceName || ADMIN_SOURCE_NAME, 120);
  const sourceUrl = textField(body.sourceUrl || "", 2000);
  const location = textField(body.location || "", 160);
  const salary = textField(body.salary || "", 120);
  const phone = textField(body.phone || "", 80);
  const lineId = textField(body.lineId || "", 80);
  if ([title, category, imageUrl, text, sourceName, sourceUrl, location, salary, phone, lineId].some((value) => value === null)) return null;
  return {
    type: body.type, title, category, imageUrl, body: text, sourceName, sourceUrl,
    location, salary, phone, lineId,
    isVerified: false,
    isScamAlert: body.isScamAlert === true
  };
}

async function handleDynamicApi(request, env, url) {
  if (url.pathname.startsWith("/api/admin/")) return handleAdmin(request, env, url);
  const audioResponse = await handleAudioNewsApi(request, env, url);
  if (audioResponse) return audioResponse;
  if (url.pathname === "/api/analytics/visit" && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const body = await requestJson(request);
    if (!body || typeof body.visit !== "boolean" || typeof body.active !== "boolean") return json({ ok: false, error: "invalid_analytics_event" }, 400);
    if (!body.visit && !body.active) return json({ ok: true, recorded: false }, 200);
    const day = myanmarDayKey();
    if (body.visitorId !== undefined) {
      if (!validAnonymousVisitorId(body.visitorId)) return json({ ok: false, error: "invalid_visitor_id" }, 400);
      await recordAnonymousActivity(env, body.visitorId, "visit", body.visit);
    } else {
      await env.DB.prepare(`INSERT INTO app_analytics_daily (day, total_visits, daily_active_users) VALUES (?, ?, ?)
        ON CONFLICT(day) DO UPDATE SET total_visits = total_visits + excluded.total_visits, daily_active_users = daily_active_users + excluded.daily_active_users`)
        .bind(day, body.visit ? 1 : 0, body.active ? 1 : 0).run();
    }
    return json({ ok: true, recorded: true }, 200, "no-store");
  }
  const postViewMatch = url.pathname.match(/^\/api\/posts\/([A-Za-z0-9_-]{1,100})\/view$/);
  if (postViewMatch && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const key = postViewMatch[1];
    const body = await requestJson(request);
    const existing = await env.DB.prepare("SELECT type, source_name, view_count FROM posts WHERE id = ? AND type = 'news'").bind(key).first();
    const enabledSources = await getEnabledNewsSourceNames(env, "all");
    if (!isMmVoiceNewsPost(existing, enabledSources)) return json({ ok: false, error: "not_found" }, 404);
    await env.DB.prepare("UPDATE posts SET view_count = view_count + 1 WHERE id = ? AND type = 'news'").bind(key).run();
    if (validAnonymousVisitorId(body?.visitorId)) await recordAnonymousActivity(env, body.visitorId, "post_view");
    const row = await env.DB.prepare("SELECT view_count FROM posts WHERE id = ? AND type = 'news'").bind(key).first();
    return row ? json({ ok: true, viewCount: Number(row.view_count || 0) }, 200, "no-store") : json({ ok: false, error: "not_found" }, 404);
  }
  if (url.pathname === "/api/notifications" && request.method === "GET") {
    if (!env.DB) return json({ ok: false, error: "database_not_configured", items: [] }, 503);
    const requestedLimit = Number(url.searchParams.get("limit") || 50);
    const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, Math.floor(requestedLimit))) : 50;
    try {
      const result = await env.DB.prepare(`SELECT n.id AS notification_id, n.kind, n.created_at AS notification_created_at, p.*
        FROM notifications n JOIN posts p ON p.id = n.post_id
        WHERE p.type = 'news' AND p.source_name IN (SELECT source_name FROM news_sources WHERE region='myanmar' AND enabled=1) ORDER BY n.created_at DESC, n.id DESC LIMIT ?`).bind(limit).all();
      const items = (result.results || []).map((row) => ({
        ...postFromRow(row), notificationId: row.notification_id,
        postKey: row.id, kind: row.kind, notificationCreatedAt: row.notification_created_at
      }));
      return json({ ok: true, items }, 200, "no-store");
    } catch {
      return json({ ok: false, error: "notifications_unavailable", items: [] }, 503);
    }
  }
  if (url.pathname === "/api/news/status" && request.method === "GET") {
    if (!env.DB) return json({ ok: false, error: "database_not_configured", intervalMinutes: 6, sources: [] }, 503);
    const result = await env.DB.prepare(`SELECT s.source_name,s.feed_url,COALESCE(state.last_checked_at,'') AS last_checked_at,COALESCE(state.last_success_at,'') AS last_success_at,COALESCE(state.last_status,'pending') AS last_status,COALESCE(state.items_seen,0) AS items_seen,COALESCE(state.last_error,'') AS last_error FROM news_sources s LEFT JOIN news_sync_state state ON state.source_name=s.source_name WHERE s.region='myanmar' AND s.enabled=1 ORDER BY s.source_name`).all();
    return json({ ok: true, intervalMinutes: 6, sources: result.results || [] }, 200, "no-store");
  }
  if (url.pathname === "/api/publishers" && request.method === "GET") {
    if (!env.DB) return json({ ok: false, error: "database_not_configured", items: [] }, 503);
    const sourceName = (url.searchParams.get("sourceName") || "").trim();
    if (sourceName.length > 120) return json({ ok: false, error: "invalid_source", items: [] }, 400);
    if (sourceName) {
      const row = await env.DB.prepare("SELECT source_name, region, official_website, facebook_url FROM news_sources WHERE source_name = ? AND enabled = 1").bind(sourceName).first();
      if (!row) return json({ ok: false, error: "publisher_not_found" }, 404);
      return json({ ok: true, publisher: publicPublisherFromRow(row) }, 200, "no-store");
    }
    const requestedRegion = url.searchParams.get("region") || "myanmar";
    if (!["myanmar", "global"].includes(requestedRegion)) return json({ ok: false, error: "invalid_region", items: [] }, 400);
    const result = await env.DB.prepare("SELECT source_name, region, official_website, facebook_url FROM news_sources WHERE region = ? AND enabled = 1 ORDER BY source_name COLLATE NOCASE").bind(requestedRegion).all();
    return json({ ok: true, region: requestedRegion, items: (result.results || []).map(publicPublisherFromRow) }, 200, "no-store");
  }
  if (url.pathname === "/api/posts" && request.method === "GET") {
    if (!env.DB) return json({ ok: false, error: "database_not_configured", items: [] }, 503);
    const requestedType = url.searchParams.get("type") || "news";
    const type = requestedType === "jobs" ? "job" : requestedType;
    if (!["news", "job"].includes(type)) return json({ ok: false, error: "invalid_type", items: [] }, 400);
    if (type === "job") return json({ ok: true, items: [] }, 200, "no-store");
    const sourceName = url.searchParams.get("sourceName") || "";
    const requestedRegion = url.searchParams.get("region") || "";
    if (requestedRegion && !["myanmar", "global"].includes(requestedRegion)) return json({ ok: false, error: "invalid_region", items: [] }, 400);
    if (sourceName) {
      if (sourceName.length > 120) return json({ ok: false, error: "invalid_source", items: [] }, 400);
      const sourceQuery = requestedRegion
        ? "SELECT source_name, region FROM news_sources WHERE region = ? AND enabled = 1 AND source_name = ?"
        : "SELECT source_name, region FROM news_sources WHERE enabled = 1 AND source_name = ?";
      const source = await env.DB.prepare(sourceQuery).bind(...(requestedRegion ? [requestedRegion, sourceName] : [sourceName])).first();
      if (!source) return json({ ok: false, error: "publisher_not_found", items: [] }, 404);
      const result = await env.DB.prepare("SELECT * FROM posts WHERE type = ? AND source_name = ? ORDER BY created_at DESC, id DESC LIMIT 150").bind(type, sourceName).all();
      return json({ ok: true, sourceName: source.source_name, region: source.region, items: (result.results || []).map((row) => ({ ...postFromRow(row), region: source.region })) }, 200, "no-store");
    }
    if (requestedRegion === "global") {
      const result = await env.DB.prepare("SELECT * FROM posts WHERE type = ? AND source_name IN (SELECT source_name FROM news_sources WHERE region='global' AND enabled=1) ORDER BY created_at DESC, id DESC LIMIT 150").bind(type).all();
      return json({ ok: true, region: "global", items: (result.results || []).map((row) => ({ ...postFromRow(row), region: "global" })) }, 200, "no-store");
    }
    const result = await env.DB.prepare(`SELECT * FROM posts WHERE type = ? AND (source_name IN (SELECT source_name FROM news_sources WHERE region='myanmar' AND enabled=1) OR source_name = ?) ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC, id DESC LIMIT 150`).bind(type, ADMIN_SOURCE_NAME).all();
    return json({ ok: true, items: (result.results || []).map(postFromRow) }, 200, "no-store");
  }
  const postMatch = url.pathname.match(/^\/api\/posts\/([A-Za-z0-9_-]{1,100})$/);
  if (postMatch && request.method === "GET") {
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const row = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(postMatch[1]).first();
    const enabledSources = await getEnabledNewsSourceNames(env, "all");
    if (!row || (row.type === "news" && !isMmVoiceNewsPost(row, enabledSources))) return json({ ok: false, error: "not_found" }, 404);
    const source = row.source_name === ADMIN_SOURCE_NAME ? null : await env.DB.prepare("SELECT region FROM news_sources WHERE enabled = 1 AND source_name = ?").bind(row.source_name).first();
    return json({ ok: true, item: { ...postFromRow(row), region: source?.region || "myanmar" } });
  }
  if (url.pathname === "/api/comments" && request.method === "GET") {
    const postKey = url.searchParams.get("postKey") || "";
    if (!validKey(postKey)) return json({ ok: false, error: "invalid_post_key", items: [] }, 400);
    if (!env.DB) return json({ ok: false, error: "database_not_configured", items: [] }, 503);
    const [result, total] = await Promise.all([
      env.DB.prepare("SELECT id, post_key, author, body, created_at FROM comments WHERE post_key = ? ORDER BY created_at DESC LIMIT 80").bind(postKey).all(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM comments WHERE post_key = ?").bind(postKey).first()
    ]);
    return json({ ok: true, count: Number(total?.count || 0), items: (result.results || []).map((row) => ({ id: row.id, postKey: row.post_key, author: row.author, body: row.body, createdAt: row.created_at })) });
  }
  if (url.pathname === "/api/comments" && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const body = await requestJson(request);
    const postKey = textField(body?.postKey, 100, true);
    const commentBody = textField(body?.body, 2000, true);
    if (!postKey || !validKey(postKey) || !commentBody || commentBody.length < 2) return json({ ok: false, error: "invalid_comment" }, 400);
    const user = await getAuthenticatedUser(request, env), identity = communityIdentity(user, body?.visitorId);
    if (!identity) return json({ ok: false, error: "invalid_visitor_id" }, 400);
    const since = new Date(Date.now() - 60_000).toISOString();
    const recent = await env.DB.prepare("SELECT COUNT(*) AS count FROM comments WHERE user_id = ? AND created_at > ?").bind(identity.id, since).first();
    if (Number(recent?.count || 0) >= 4) return json({ ok: false, error: "comment_rate_limited" }, 429);
    const id = crypto.randomUUID(), createdAt = new Date().toISOString();
    await env.DB.prepare("INSERT INTO comments (id, post_key, author, body, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, postKey, identity.name, commentBody, createdAt, identity.id).run();
    if (validAnonymousVisitorId(body?.visitorId)) await recordAnonymousActivity(env, body.visitorId, "comment");
    const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM comments WHERE post_key = ?").bind(postKey).first();
    return json({ ok: true, count: Number(total?.count || 0), item: { id, postKey, author: identity.name, body: commentBody, createdAt } }, 201);
  }
  if (url.pathname === "/api/likes" && request.method === "POST") {
    if (!sameOriginMutation(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const body = await requestJson(request);
    const postKey = textField(body?.postKey, 100, true);
    if (!postKey || !validKey(postKey)) return json({ ok: false, error: "invalid_post_key" }, 400);
    const user = await getAuthenticatedUser(request, env), identity = communityIdentity(user, body?.visitorId);
    if (!identity) return json({ ok: false, error: "invalid_visitor_id" }, 400);
    const existing = await env.DB.prepare("SELECT visitor_id FROM likes WHERE post_key = ? AND visitor_id = ?").bind(postKey, identity.id).first();
    const desired = typeof body?.liked === "boolean" ? body.liked : !existing;
    let insertedLike = false;
    if (desired) {
      const inserted = await env.DB.prepare("INSERT OR IGNORE INTO likes (post_key, visitor_id, created_at) VALUES (?, ?, ?)").bind(postKey, identity.id, new Date().toISOString()).run();
      insertedLike = Number(inserted?.meta?.changes || 0) > 0;
    }
    else await env.DB.prepare("DELETE FROM likes WHERE post_key = ? AND visitor_id = ?").bind(postKey, identity.id).run();
    if (insertedLike && validAnonymousVisitorId(body?.visitorId)) await recordAnonymousActivity(env, body.visitorId, "like");
    const [total, commentTotal, after] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS count FROM likes WHERE post_key = ?").bind(postKey).first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM comments WHERE post_key = ?").bind(postKey).first(),
      env.DB.prepare("SELECT visitor_id FROM likes WHERE post_key = ? AND visitor_id = ?").bind(postKey, identity.id).first()
    ]);
    return json({ ok: true, liked: Boolean(after), count: Number(total?.count || 0), commentCount: Number(commentTotal?.count || 0) });
  }
  if (url.pathname === "/api/engagement" && request.method === "GET") {
    const postKey = url.searchParams.get("postKey") || "";
    if (!validKey(postKey)) return json({ ok: false, error: "invalid_post_key" }, 400);
    if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const user = await getAuthenticatedUser(request, env);
    const [count, commentCount] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS count FROM likes WHERE post_key = ?").bind(postKey).first(),
      env.DB.prepare("SELECT COUNT(*) AS count FROM comments WHERE post_key = ?").bind(postKey).first()
    ]);
    const identity = communityIdentity(user, url.searchParams.get("visitorId"));
    const existing = identity
      ? await env.DB.prepare("SELECT visitor_id FROM likes WHERE post_key = ? AND visitor_id = ?").bind(postKey, identity.id).first()
      : null;
    return json({ ok: true, count: Number(count?.count || 0), commentCount: Number(commentCount?.count || 0), liked: Boolean(existing) });
  }
  if (url.pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);
  return null;
}
