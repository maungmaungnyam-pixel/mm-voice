import { createRemoteJWKSet, importX509, jwtVerify } from "jose";

const SESSION_COOKIE = "tb_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_TTL_SECONDS = 10 * 60;
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const encoder = new TextEncoder();
const FIREBASE_CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let firebaseCerts = null;
let firebaseCertsExpiresAt = 0;
const firebaseKeyCache = new Map();

async function getFirebaseCerts(forceRefresh = false) {
  if (!forceRefresh && firebaseCerts && Date.now() < firebaseCertsExpiresAt) return firebaseCerts;
  const response = await fetch(FIREBASE_CERT_URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("firebase_certificates_unavailable");
  const certs = await response.json();
  if (!certs || typeof certs !== "object" || Array.isArray(certs)) throw new Error("firebase_certificates_invalid");
  const maxAgeMatch = (response.headers.get("cache-control") || "").match(/(?:^|,)\s*max-age=(\d+)/i);
  const maxAge = Math.min(86400, Math.max(60, Number(maxAgeMatch?.[1]) || 300));
  firebaseCerts = certs;
  firebaseCertsExpiresAt = Date.now() + maxAge * 1000;
  firebaseKeyCache.clear();
  return firebaseCerts;
}

async function firebaseSigningKey(header) {
  if (!header || header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid || header.kid.length > 128) {
    throw new Error("firebase_signing_key_invalid");
  }
  let certs = await getFirebaseCerts();
  if (typeof certs[header.kid] !== "string") certs = await getFirebaseCerts(true);
  const certificate = certs[header.kid];
  if (typeof certificate !== "string") throw new Error("firebase_signing_key_missing");
  let key = firebaseKeyCache.get(header.kid);
  if (!key) {
    key = await importX509(certificate, "RS256");
    firebaseKeyCache.set(header.kid, key);
  }
  return key;
}

async function verifyFirebaseIdToken(token, projectId) {
  const { payload } = await jwtVerify(token, firebaseSigningKey, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"],
    requiredClaims: ["exp", "iat", "auth_time", "sub"],
    clockTolerance: 30
  });
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.sub !== "string" || payload.sub.length < 1 || payload.sub.length > 128 ||
      typeof payload.email !== "string" || payload.email.length > 254 || !payload.email.includes("@") ||
      typeof payload.email_verified !== "boolean" || typeof payload.iat !== "number" || payload.iat > now + 60 ||
      typeof payload.auth_time !== "number" || payload.auth_time > now + 60) {
    throw new Error("firebase_identity_invalid");
  }
  return payload;
}

function firebaseProjectId(env) {
  const projectId = typeof env.AUTH_FIREBASE_PROJECT_ID === "string" ? env.AUTH_FIREBASE_PROJECT_ID.trim() : "";
  return env.AUTH_FIREBASE_EMAIL_ENABLED === "true" && /^[a-z0-9-]{3,100}$/.test(projectId) ? projectId : "";
}

const PROVIDERS = {
  google: {
    clientId: "GOOGLE_CLIENT_ID",
    clientSecret: "GOOGLE_CLIENT_SECRET",
    callback: "/api/auth/google/callback"
  },
  facebook: {
    clientId: "FACEBOOK_APP_ID",
    clientSecret: "FACEBOOK_APP_SECRET",
    callback: "/api/auth/facebook/callback"
  },
  line: {
    clientId: "LINE_CHANNEL_ID",
    clientSecret: "LINE_CHANNEL_SECRET",
    callback: "/api/auth/line/callback"
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer"
    }
  });
}

function redirect(location, cookies = []) {
  const headers = new Headers({
    location,
    "cache-control": "no-store",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff"
  });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomToken(byteLength = 32) {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sha256(value) {
  return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

async function pkceChallenge(verifier) {
  return sha256(verifier);
}

function cookieValue(request, name) {
  const prefix = `${name}=`;
  for (const item of (request.headers.get("cookie") || "").split(";")) {
    const part = item.trim();
    if (part.startsWith(prefix)) return part.slice(prefix.length);
  }
  return "";
}

function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function oauthStateCookie(state, maxAge = OAUTH_TTL_SECONDS) {
  return `tb_oauth_${state}=${state}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function publicOrigin(request, env) {
  const configured = typeof env.AUTH_PUBLIC_ORIGIN === "string" ? env.AUTH_PUBLIC_ORIGIN.trim() : "";
  const origin = configured || new URL(request.url).origin;
  const parsed = new URL(origin);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("invalid_auth_origin");
  }
  return parsed.origin;
}

function providerCredentials(env, provider) {
  const config = PROVIDERS[provider];
  if (!config) return null;
  const clientId = typeof env[config.clientId] === "string" ? env[config.clientId].trim() : "";
  const clientSecret = typeof env[config.clientSecret] === "string" ? env[config.clientSecret].trim() : "";
  return clientId && clientSecret ? { ...config, clientId, clientSecret } : null;
}

function providersStatus(env) {
  return {
    google: Boolean(providerCredentials(env, "google")),
    firebaseGoogle: env.AUTH_FIREBASE_GOOGLE_ENABLED === "true" && Boolean(firebaseProjectId(env)),
    facebook: Boolean(providerCredentials(env, "facebook")),
    line: Boolean(providerCredentials(env, "line")),
    emailPassword: Boolean(firebaseProjectId(env))
  };
}

function sameOrigin(request, url) {
  return request.headers.get("origin") === url.origin;
}

async function formPost(endpoint, fields) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
    signal: AbortSignal.timeout(12000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object") throw new Error("provider_exchange_failed");
  return data;
}

async function getJson(endpoint) {
  const response = await fetch(endpoint, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object") throw new Error("provider_lookup_failed");
  return data;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
  return [...signature].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function authStartUrl(provider, credentials, callbackUrl, state, nonce, verifier) {
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    state
  });
  if (provider === "google") {
    params.set("scope", "openid email profile");
    params.set("nonce", nonce);
    params.set("prompt", "select_account");
    params.set("code_challenge", verifier.challenge);
    params.set("code_challenge_method", "S256");
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
  if (provider === "facebook") {
    params.set("scope", "public_profile,email");
    return `https://www.facebook.com/v26.0/dialog/oauth?${params.toString()}`;
  }
  params.set("scope", "openid profile");
  params.set("nonce", nonce);
  params.set("code_challenge", verifier.challenge);
  params.set("code_challenge_method", "S256");
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

async function startOAuth(request, env, url, provider) {
  if (request.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
  const credentials = providerCredentials(env, provider);
  if (!credentials) return json({ ok: false, error: "provider_not_configured" }, 503);

  try {
    const state = randomToken();
    const nonce = randomToken();
    const codeVerifier = provider === "facebook" ? "" : randomToken(48);
    const challenge = codeVerifier ? await pkceChallenge(codeVerifier) : "";
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + OAUTH_TTL_SECONDS * 1000).toISOString();
    await env.DB.prepare("DELETE FROM auth_oauth_states WHERE expires_at <= ?").bind(createdAt.toISOString()).run();
    await env.DB.prepare(
      "INSERT INTO auth_oauth_states (state_hash, provider, nonce, code_verifier, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(await sha256(state), provider, nonce, codeVerifier, createdAt.toISOString(), expiresAt).run();

    const origin = publicOrigin(request, env);
    const callbackUrl = `${origin}${credentials.callback}`;
    const authorizationUrl = authStartUrl(provider, credentials, callbackUrl, state, nonce, { verifier: codeVerifier, challenge });
    return redirect(authorizationUrl, [oauthStateCookie(state)]);
  } catch {
    return json({ ok: false, error: "auth_start_failed" }, 503);
  }
}

async function consumeOAuthState(request, env, provider, state) {
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(state)) return null;
  if (cookieValue(request, `tb_oauth_${state}`) !== state) return null;
  const now = new Date().toISOString();
  const stateHash = await sha256(state);
  const consumed = await env.DB.prepare(
    "UPDATE auth_oauth_states SET expires_at = '1970-01-01T00:00:00.000Z' WHERE state_hash = ? AND provider = ? AND expires_at > ?"
  ).bind(stateHash, provider, now).run();
  if (Number(consumed?.meta?.changes || 0) !== 1) return null;
  const row = await env.DB.prepare(
    "SELECT nonce, code_verifier FROM auth_oauth_states WHERE state_hash = ? AND provider = ?"
  ).bind(stateHash, provider).first();
  await env.DB.prepare("DELETE FROM auth_oauth_states WHERE state_hash = ?").bind(stateHash).run();
  return row || null;
}

async function exchangeGoogle(code, credentials, callbackUrl, verifier, nonce) {
  const tokens = await formPost("https://oauth2.googleapis.com/token", {
    code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: callbackUrl,
    grant_type: "authorization_code",
    code_verifier: verifier
  });
  if (typeof tokens.id_token !== "string") throw new Error("provider_identity_missing");
  const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: credentials.clientId,
    clockTolerance: 5
  });
  if (typeof payload.sub !== "string" || !payload.sub || payload.nonce !== nonce) {
    throw new Error("provider_identity_invalid");
  }
  if (payload.email_verified !== true) throw new Error("provider_email_unverified");
  return {
    subject: payload.sub,
    name: typeof payload.name === "string" ? payload.name.slice(0, 100) : "",
    email: typeof payload.email === "string" ? payload.email.slice(0, 254) : "",
    emailVerified: true
  };
}

async function exchangeFacebook(code, credentials, callbackUrl) {
  const tokenUrl = new URL("https://graph.facebook.com/v26.0/oauth/access_token");
  tokenUrl.search = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: callbackUrl,
    code
  }).toString();
  const tokenResult = await getJson(tokenUrl);
  if (typeof tokenResult.access_token !== "string" || !tokenResult.access_token) throw new Error("provider_identity_missing");

  const debugUrl = new URL("https://graph.facebook.com/v26.0/debug_token");
  debugUrl.search = new URLSearchParams({
    input_token: tokenResult.access_token,
    access_token: `${credentials.clientId}|${credentials.clientSecret}`
  }).toString();
  const debug = (await getJson(debugUrl)).data;
  if (!debug?.is_valid || String(debug.app_id) !== credentials.clientId || debug.type !== "USER" || !debug.user_id) {
    throw new Error("provider_identity_invalid");
  }

  const meUrl = new URL("https://graph.facebook.com/v26.0/me");
  meUrl.search = new URLSearchParams({
    fields: "id,name,email",
    access_token: tokenResult.access_token,
    appsecret_proof: await hmacHex(credentials.clientSecret, tokenResult.access_token)
  }).toString();
  const profile = await getJson(meUrl);
  if (String(profile.id) !== String(debug.user_id)) throw new Error("provider_identity_invalid");
  return {
    subject: String(profile.id),
    name: typeof profile.name === "string" ? profile.name.slice(0, 100) : "",
    email: typeof profile.email === "string" ? profile.email.slice(0, 254) : "",
    emailVerified: false
  };
}

async function exchangeLine(code, credentials, callbackUrl, verifier, nonce) {
  const tokens = await formPost("https://api.line.me/oauth2/v2.1/token", {
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUrl,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code_verifier: verifier
  });
  if (typeof tokens.id_token !== "string") throw new Error("provider_identity_missing");
  const verified = await formPost("https://api.line.me/oauth2/v2.1/verify", {
    id_token: tokens.id_token,
    client_id: credentials.clientId
  });
  if (verified.iss !== "https://access.line.me" || String(verified.aud) !== credentials.clientId || !verified.sub || verified.nonce !== nonce) {
    throw new Error("provider_identity_invalid");
  }
  if (Number(verified.exp) <= Math.floor(Date.now() / 1000)) throw new Error("provider_identity_expired");
  return {
    subject: String(verified.sub),
    name: typeof verified.name === "string" ? verified.name.slice(0, 100) : "",
    email: typeof verified.email === "string" ? verified.email.slice(0, 254) : "",
    emailVerified: false
  };
}

async function getOrCreateUser(env, provider, identity) {
  const existing = await env.DB.prepare(
    "SELECT user_id FROM auth_identities WHERE provider = ? AND provider_subject = ?"
  ).bind(provider, identity.subject).first();
  if (existing?.user_id) return existing.user_id;

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .bind(userId, identity.name || "MM VOICE member", now, now).run();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO auth_identities (provider, provider_subject, user_id, provider_email, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(provider, identity.subject, userId, identity.email || "", identity.emailVerified ? 1 : 0, now).run();
  const linked = await env.DB.prepare(
    "SELECT user_id FROM auth_identities WHERE provider = ? AND provider_subject = ?"
  ).bind(provider, identity.subject).first();
  if (!linked?.user_id) {
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    throw new Error("identity_store_failed");
  }
  if (linked.user_id !== userId) await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
  return linked.user_id;
}

async function createSession(env, userId) {
  const token = randomToken(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();
  await env.DB.prepare("INSERT INTO auth_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, now.toISOString(), expiresAt).run();
  return token;
}

async function currentSession(request, env) {
  if (!env.DB) return null;
  const token = cookieValue(request, SESSION_COOKIE);
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return null;
  const now = new Date().toISOString();
  return env.DB.prepare(
    "SELECT u.id, u.display_name, COALESCE(pc.email_normalized, (SELECT ai.provider_email FROM auth_identities ai WHERE ai.user_id = u.id AND ai.provider_email <> '' ORDER BY ai.email_verified DESC LIMIT 1), '') AS email, s.token_hash FROM auth_sessions s JOIN users u ON u.id = s.user_id LEFT JOIN password_credentials pc ON pc.user_id = u.id WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? LIMIT 1"
  ).bind(await sha256(token), now).first();
}

async function resolveAuthIdentity(request, env) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization) {
    const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
    const projectId = firebaseProjectId(env);
    if (!match || !projectId || match[1].length > 16384) return { user: null, verificationRequired: false };
    try {
      const payload = await verifyFirebaseIdToken(match[1], projectId);
      const emailVerified = payload.email_verified === true;
      const email = payload.email.trim().toLowerCase();
      const name = typeof payload.name === "string"
        ? payload.name.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 100)
        : "";
      return {
        user: emailVerified ? {
          id: `firebase:${payload.sub}`,
          name: name || email.split("@")[0] || "MM VOICE member",
          email,
          emailVerified: true
        } : null,
        verificationRequired: !emailVerified
      };
    } catch {
      return { user: null, verificationRequired: false };
    }
  }

  const user = await currentSession(request, env);
  return {
    user: user ? { id: user.id, name: user.display_name, email: user.email || "" } : null,
    verificationRequired: false
  };
}

async function callback(request, env, url, provider) {
  const rawState = url.searchParams.get("state") || "";
  const clearStateCookie = rawState && /^[A-Za-z0-9_-]{40,80}$/.test(rawState)
    ? `tb_oauth_${rawState}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
    : "";
  const origin = publicOrigin(request, env);
  const fail = () => redirect(`${origin}/?auth=failed`, clearStateCookie ? [clearStateCookie] : []);
  if (request.method !== "GET" || url.searchParams.has("error")) {
    return redirect(`${origin}/?auth=cancelled`, clearStateCookie ? [clearStateCookie] : []);
  }
  if (!env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
  const credentials = providerCredentials(env, provider);
  if (!credentials) return fail();

  try {
    const code = url.searchParams.get("code") || "";
    if (!code || code.length > 4096) return fail();
    const flow = await consumeOAuthState(request, env, provider, rawState);
    if (!flow) return fail();
    const callbackUrl = `${origin}${credentials.callback}`;
    let identity;
    if (provider === "google") identity = await exchangeGoogle(code, credentials, callbackUrl, flow.code_verifier, flow.nonce);
    else if (provider === "facebook") identity = await exchangeFacebook(code, credentials, callbackUrl);
    else identity = await exchangeLine(code, credentials, callbackUrl, flow.code_verifier, flow.nonce);
    const userId = await getOrCreateUser(env, provider, identity);
    const sessionToken = await createSession(env, userId);
    return redirect(`${origin}/?auth=connected`, [sessionCookie(sessionToken), ...(clearStateCookie ? [clearStateCookie] : [])]);
  } catch {
    return fail();
  }
}

async function logout(request, env, url) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!sameOrigin(request, url)) return json({ ok: false, error: "same_origin_required" }, 403);
  const session = await currentSession(request, env);
  if (session && env.DB) {
    await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL")
      .bind(new Date().toISOString(), session.token_hash).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "set-cookie": sessionCookie("", 0),
      "x-content-type-options": "nosniff"
    }
  });
}

export async function getAuthenticatedUser(request, env) {
  const identity = await resolveAuthIdentity(request, env);
  return identity.user;
}

export async function handleAuth(request, env, url) {
  if (!url.pathname.startsWith("/api/auth/")) return null;
  if (url.pathname === "/api/auth/status" && request.method === "GET") {
    const identity = await resolveAuthIdentity(request, env);
    return json({
      ok: true,
      guestRead: true,
      memberActions: true,
      providers: providersStatus(env),
      user: identity.user,
      verificationRequired: identity.verificationRequired
    });
  }
  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    const identity = await resolveAuthIdentity(request, env);
    return json({ ok: true, user: identity.user, verificationRequired: identity.verificationRequired });
  }
  if (url.pathname === "/api/auth/logout") return logout(request, env, url);

  const match = url.pathname.match(/^\/api\/auth\/(google|facebook|line)\/(start|callback)$/);
  if (!match) return json({ ok: false, error: "not_found" }, 404);
  const [, provider, action] = match;
  if (action === "start") return startOAuth(request, env, url, provider);
  return callback(request, env, url, provider);
}
