import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "../worker.mjs";

const visitorA = "123e4567-e89b-42d3-a456-426614174000";
const visitorB = "123e4567-e89b-42d3-b456-426614174001";

function memoryD1() {
  const comments = [];
  const likes = new Map();
  return {
    comments,
    likes,
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        async first() {
          if (sql.includes("SELECT COUNT(*) AS count FROM comments WHERE user_id = ?")) {
            return { count: comments.filter((row) => row.user_id === values[0] && row.created_at > values[1]).length };
          }
          if (sql.includes("SELECT COUNT(*) AS count FROM comments WHERE post_key = ?")) {
            return { count: comments.filter((row) => row.post_key === values[0]).length };
          }
          if (sql.includes("SELECT COUNT(*) AS count FROM likes WHERE post_key = ?")) {
            return { count: [...likes.keys()].filter((key) => key.startsWith(`${values[0]}\u0000`)).length };
          }
          if (sql.includes("SELECT visitor_id FROM likes WHERE post_key = ? AND visitor_id = ?")) {
            const row = likes.get(`${values[0]}\u0000${values[1]}`);
            return row ? { visitor_id: row.visitor_id } : null;
          }
          return null;
        },
        async all() {
          if (sql.includes("FROM comments WHERE post_key = ? ORDER BY created_at DESC")) {
            return { results: comments.filter((row) => row.post_key === values[0]).slice().reverse().slice(0, 80) };
          }
          return { results: [] };
        },
        async run() {
          if (sql.includes("INSERT INTO comments")) {
            const [id, post_key, author, body, created_at, user_id] = values;
            comments.push({ id, post_key, author, body, created_at, user_id });
          } else if (sql.includes("INSERT OR IGNORE INTO likes")) {
            const [post_key, visitor_id, created_at] = values;
            likes.set(`${post_key}\u0000${visitor_id}`, { post_key, visitor_id, created_at });
          } else if (sql.includes("DELETE FROM likes")) {
            likes.delete(`${values[0]}\u0000${values[1]}`);
          }
          return { success: true };
        }
      };
    }
  };
}

function postRequest(path, payload, origin = "https://mm-voice.test") {
  return new Request(`https://mm-voice.test${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function json(response) { return response.json(); }

test("a guest comment is stored and returned publicly", async () => {
  const DB = memoryD1();
  const response = await worker.fetch(postRequest("/api/comments", { postKey: "story-1", body: "Helpful update", visitorId: visitorA }), { DB });
  const created = await json(response);
  assert.equal(response.status, 201);
  assert.equal(created.item.author, "Community member");
  assert.equal(created.count, 1);
  assert.equal(DB.comments[0].user_id, `guest:${visitorA}`);

  const publicResponse = await worker.fetch(new Request("https://mm-voice.test/api/comments?postKey=story-1"), { DB });
  const publicData = await json(publicResponse);
  assert.equal(publicData.count, 1);
  assert.equal(publicData.items[0].body, "Helpful update");
});

test("likes persist in the app D1, are idempotent, and expose shared totals per visitor", async () => {
  const DB = memoryD1();
  const first = await json(await worker.fetch(postRequest("/api/likes", { postKey: "story-2", visitorId: visitorA, liked: true }), { DB }));
  assert.deepEqual({ liked: first.liked, count: first.count }, { liked: true, count: 1 });
  const repeated = await json(await worker.fetch(postRequest("/api/likes", { postKey: "story-2", visitorId: visitorA, liked: true }), { DB }));
  assert.deepEqual({ liked: repeated.liked, count: repeated.count }, { liked: true, count: 1 });

  const ownState = await json(await worker.fetch(new Request(`https://mm-voice.test/api/engagement?postKey=story-2&visitorId=${visitorA}`), { DB }));
  const otherState = await json(await worker.fetch(new Request(`https://mm-voice.test/api/engagement?postKey=story-2&visitorId=${visitorB}`), { DB }));
  assert.equal(ownState.liked, true);
  assert.equal(otherState.liked, false);
  assert.equal(otherState.count, 1);

  const removed = await json(await worker.fetch(postRequest("/api/likes", { postKey: "story-2", visitorId: visitorA, liked: false }), { DB }));
  assert.deepEqual({ liked: removed.liked, count: removed.count }, { liked: false, count: 0 });
});

test("guest comments require a valid visitor id and retain the per-identity rate limit", async () => {
  const DB = memoryD1();
  const invalid = await worker.fetch(postRequest("/api/comments", { postKey: "story-3", body: "No identity" }), { DB });
  assert.equal(invalid.status, 400);
  assert.equal((await json(invalid)).error, "invalid_visitor_id");
  for (let index = 0; index < 4; index++) {
    const response = await worker.fetch(postRequest("/api/comments", { postKey: "story-3", body: `Comment ${index}`, visitorId: visitorA }), { DB });
    assert.equal(response.status, 201);
  }
  const limited = await worker.fetch(postRequest("/api/comments", { postKey: "story-3", body: "One more", visitorId: visitorA }), { DB });
  assert.equal(limited.status, 429);
  assert.equal((await json(limited)).error, "comment_rate_limited");
});

test("news card visibility records a view without requiring See more", async () => {
  const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /recordPostView\(card\._postItem\)/);
  assert.match(app, /rootMargin: '0px', threshold: 0\.01/);
  assert.match(app, /sessionStorage\.setItem\('mmvoice\.viewedPosts\.v1'/);
});
