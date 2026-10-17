const CACHE_NAME = "mm-voice-shell-v1";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/app.js",
  "/app.css",
  "/social.css",
  "/notifications.css",
  "/publishers.css",
  "/audio.css",
  "/images/mm-voice-logo.svg",
  "/icons/icon-32.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png"
];
const STATIC_PATHS = new Set(SHELL_ASSETS.map((asset) => new URL(asset, self.location.origin).pathname));

function cacheKey(request) {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}`, { method: "GET" });
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith("mm-voice-shell-") && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (response.ok && response.type !== "opaque") {
      await cache.put(cacheKey(request), response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(cacheKey(request));
    if (cached) return cached;
    if (request.mode === "navigate") {
      return await cache.match(new Request(`${self.location.origin}/`))
        || await cache.match(new Request(`${self.location.origin}/index.html`))
        || new Response("MM VOICE is offline. Check your connection and try again.", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" }
        });
    }
    return new Response("Offline", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/admin" || url.pathname.startsWith("/admin/") || url.pathname.startsWith("/auth/")) return;

  const isAppNavigation = request.mode === "navigate" && (url.pathname === "/" || url.pathname === "/index.html");
  const isStaticAsset = STATIC_PATHS.has(url.pathname) || url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/");
  if (!isAppNavigation && !isStaticAsset) return;

  event.respondWith(networkFirst(request));
});
