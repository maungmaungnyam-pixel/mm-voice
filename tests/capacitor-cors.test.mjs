import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.mjs";

const API = "https://mm-voice.example.invalid";

function optionsRequest(origin, method = "POST", headers = "content-type,authorization") {
  return new Request(`${API}/api/analytics/visit`, {
    method: "OPTIONS",
    headers: {
      origin,
      "access-control-request-method": method,
      "access-control-request-headers": headers
    }
  });
}

test("Android Capacitor origin receives a narrowly scoped API preflight response", async () => {
  const response = await worker.fetch(optionsRequest("https://localhost"), {});
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://localhost");
  assert.match(response.headers.get("access-control-allow-methods"), /POST/);
  assert.match(response.headers.get("access-control-allow-headers"), /authorization/i);
  assert.equal(response.headers.get("access-control-allow-credentials"), null);
});

test("unapproved origins and headers are rejected by API preflight", async () => {
  const originResponse = await worker.fetch(optionsRequest("https://attacker.example"), {});
  assert.equal(originResponse.status, 403);
  assert.equal(originResponse.headers.get("access-control-allow-origin"), null);

  const headerResponse = await worker.fetch(optionsRequest("https://localhost", "POST", "x-unapproved-header"), {});
  assert.equal(headerResponse.status, 403);
});

test("API data responses carry CORS headers only for approved origins", async () => {
  const allowed = await worker.fetch(new Request(`${API}/api/health`, { headers: { origin: "https://localhost" } }), {});
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://localhost");

  const denied = await worker.fetch(new Request(`${API}/api/health`, { headers: { origin: "https://attacker.example" } }), {});
  assert.equal(denied.status, 200);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("mobile API mutation origin is allowed while arbitrary cross-origin mutation is rejected", async () => {
  const makeRequest = (origin) => new Request(`${API}/api/analytics/visit`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ visit: true, active: true })
  });
  const blocked = await worker.fetch(makeRequest("https://attacker.example"), {});
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).error, "same_origin_required");

  const allowed = await worker.fetch(makeRequest("https://localhost"), {});
  assert.equal(allowed.status, 503);
  assert.equal((await allowed.json()).error, "database_not_configured");
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://localhost");
});
