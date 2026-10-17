import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(projectRoot, "public/index.html"), "utf8");
const app = readFileSync(path.join(projectRoot, "public/app.js"), "utf8");
const serviceWorker = readFileSync(path.join(projectRoot, "public/sw.js"), "utf8");
const worker = readFileSync(path.join(projectRoot, "worker.mjs"), "utf8");
const wrangler = readFileSync(path.join(projectRoot, "wrangler.toml"), "utf8");
const manifest = JSON.parse(readFileSync(path.join(projectRoot, "public/manifest.webmanifest"), "utf8"));

test("PWA manifest meets mobile installation requirements and all PNG icons match their declared sizes", () => {
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.prefer_related_applications, false);
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest">/);
  assert.match(html, /rel="apple-touch-icon" sizes="180x180" href="\/icons\/apple-touch-icon\.png"/);

  for (const size of ["192x192", "512x512"]) {
    const icon = manifest.icons.find((entry) => entry.sizes === size && entry.purpose === "any");
    assert.ok(icon, `missing standard ${size} icon`);
    const png = readFileSync(path.join(projectRoot, "public", icon.src.replace(/^\//, "")));
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(png.readUInt32BE(16), Number(size.split("x")[0]));
    assert.equal(png.readUInt32BE(20), Number(size.split("x")[1]));
    const maskable = manifest.icons.find((entry) => entry.sizes === size && entry.purpose === "maskable");
    assert.ok(maskable, `missing maskable ${size} icon`);
  }
});

test("PWA service worker is registered at root and does not intercept live API, admin, or auth requests", () => {
  assert.match(app, /navigator\.serviceWorker\.register\('\/sw\.js', \{ scope: '\/', updateViaCache: 'none' \}\)/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(serviceWorker, /url\.pathname === "\/admin"/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/auth\/"\)/);
  assert.match(serviceWorker, /fetch\(request, \{ cache: "no-cache" \}\)/);
  assert.match(serviceWorker, /cache\.addAll\(SHELL_ASSETS\)/);
  assert.match(serviceWorker, /self\.clients\.claim\(\)/);
});

test("in-app installation uses the browser prompt when available and gives iOS and Android fallback steps", () => {
  assert.match(html, /id="drawer-install-app"/);
  assert.match(html, /id="install-guide"/);
  assert.match(html, /data-install-steps="ios"/);
  assert.match(html, /data-install-steps="android"/);
  assert.match(app, /addEventListener\('beforeinstallprompt'/);
  assert.match(app, /promptEvent\.prompt\(\)/);
  assert.match(app, /addEventListener\('appinstalled'/);
  assert.match(app, /installGuideTitle/);
});

test("Cloudflare serves the PWA control files with explicit content and scope headers", () => {
  assert.ok(wrangler.includes('"/sw.js"') && wrangler.includes('"/manifest.webmanifest"'));
  assert.match(worker, /service-worker-allowed/);
  assert.match(worker, /application\/manifest\+json/);
  assert.match(worker, /no-cache, no-store, must-revalidate/);
});

test("install action appears before the long drawer sections for easy mobile access", () => {
  const installPosition = html.indexOf('id="drawer-install-app"');
  const audioPosition = html.indexOf('class="drawer-audio"');
  assert.ok(installPosition >= 0 && installPosition < audioPosition);
  assert.match(html, /class="drawer-item drawer-install-action"[^>]*aria-haspopup="dialog"/);
});
