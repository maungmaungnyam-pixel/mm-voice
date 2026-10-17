import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("MM VOICE renders safe inline video players in feed cards and story details", async () => {
  const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/social.css", import.meta.url), "utf8");

  assert.match(app, /function isVideoEmbed\(value\)/);
  assert.match(app, /www\.youtube-nocookie\.com/);
  assert.match(app, /player\.vimeo\.com/);
  assert.match(app, /frame\.loading = loading/);
  assert.match(app, /makeVideoEmbed\(videoUrl, postTitle\(item\)\)/);
  assert.match(app, /detail-video-embed/);
  assert.match(html, /id="detail-video-embed"[^>]*allowfullscreen/);
  assert.match(css, /\.post-video-embed,\.detail-video-embed/);
  assert.match(app, /video-viewer-button/);
  assert.match(app, /detail\.classList\.toggle\('video-theater-view', Boolean\(videoUrl\)\)/);
  assert.match(app, /video\.currentTime = Math\.max\(0, Number\(playback\.time\) \|\| 0\)/);
  assert.match(html, /class="detail-panel"/);
  assert.match(css, /\.video-theater-view \.detail-shell\{display:grid/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /\.video-theater-view #detail-video,\.video-theater-view #detail-video-embed\{position:absolute/);
  assert.match(css, /detail-content #detail-body,\.video-theater-view \.detail-content #detail-source-full\{display:none!important\}/);
  assert.match(css, /\.video-theater-view \.detail-actions\{position:absolute/);
  assert.match(css, /\.video-theater-view\.video-comments-open \.detail-comments\{display:block\}/);
  assert.match(app, /detail\.classList\.toggle\('video-comments-open', open\)/);
});
