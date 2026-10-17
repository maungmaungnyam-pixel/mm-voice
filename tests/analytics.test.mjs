import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import worker from "../worker.mjs";

function makeAnalyticsDB() {
  const visitors = new Map();
  const visitorDays = new Map();
  const daily = new Map();
  const DB = {
    prepare(sql) {
      let values = [];
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
      return {
        bind(...args) { values = args; return this; },
        async run() {
          if (normalized.startsWith("insert or ignore into analytics_visitor_days")) {
            const [visitorHash, day, lastSeenAt] = values;
            const key = `${visitorHash}:${day}`;
            const changes = visitorDays.has(key) ? 0 : 1;
            if (changes) visitorDays.set(key, { visitorHash, day, visits: 0, postViews: 0, likes: 0, comments: 0, lastSeenAt });
            return { meta: { changes } };
          }
          if (normalized.startsWith("insert into analytics_visitors")) {
            const [visitorHash, firstSeenAt, lastSeenAt, visits, activeDays, postViews, likes, comments] = values;
            const old = visitors.get(visitorHash);
            visitors.set(visitorHash, {
              firstSeenAt: old?.firstSeenAt || firstSeenAt,
              lastSeenAt,
              visits: (old?.visits || 0) + visits,
              activeDays: (old?.activeDays || 0) + activeDays,
              postViews: (old?.postViews || 0) + postViews,
              likes: (old?.likes || 0) + likes,
              comments: (old?.comments || 0) + comments
            });
            return { meta: { changes: 1 } };
          }
          if (normalized.startsWith("update analytics_visitor_days set")) {
            const [visits, postViews, likes, comments, lastSeenAt, visitorHash, day] = values;
            const row = visitorDays.get(`${visitorHash}:${day}`);
            if (row) Object.assign(row, { visits: row.visits + visits, postViews: row.postViews + postViews, likes: row.likes + likes, comments: row.comments + comments, lastSeenAt });
            return { meta: { changes: row ? 1 : 0 } };
          }
          if (normalized.startsWith("insert into app_analytics_daily")) {
            const [day, visits, active] = values;
            const row = daily.get(day) || { visits: 0, active: 0 };
            row.visits += visits; row.active += active; daily.set(day, row);
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }
      };
    },
    async batch(statements) { return Promise.all(statements.map((statement) => statement.run())); }
  };
  return { DB, visitors, visitorDays, daily };
}

function visitRequest(visitorId, visit, active) {
  return new Request("https://mm-voice.test/api/analytics/visit", {
    method: "POST",
    headers: { origin: "https://mm-voice.test", "content-type": "application/json" },
    body: JSON.stringify({ visitorId, visit, active })
  });
}

test("visitor analytics stores a one-way browser hash and counts active browsers once per day", async () => {
  const state = makeAnalyticsDB();
  const visitorId = "123e4567-e89b-42d3-a456-426614174000";
  const expectedHash = createHash("sha256").update(visitorId).digest("base64url");

  const first = await worker.fetch(visitRequest(visitorId, true, true), { DB: state.DB });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).recorded, true);
  const repeat = await worker.fetch(visitRequest(visitorId, false, true), { DB: state.DB });
  assert.equal(repeat.status, 200);

  assert.equal(state.visitors.has(expectedHash), true);
  assert.equal(state.visitors.has(visitorId), false);
  assert.deepEqual(state.visitors.get(expectedHash), {
    firstSeenAt: state.visitors.get(expectedHash).firstSeenAt,
    lastSeenAt: state.visitors.get(expectedHash).lastSeenAt,
    visits: 1,
    activeDays: 1,
    postViews: 0,
    likes: 0,
    comments: 0
  });
  assert.equal(state.visitorDays.size, 1);
  assert.deepEqual([...state.daily.values()], [{ visits: 1, active: 1 }]);
});

test("visitor analytics rejects malformed browser IDs without recording them", async () => {
  const state = makeAnalyticsDB();
  const response = await worker.fetch(visitRequest("not-a-visitor-id", true, true), { DB: state.DB });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_visitor_id");
  assert.equal(state.visitors.size, 0);
  assert.equal(state.visitorDays.size, 0);
});
