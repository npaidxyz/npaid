import assert from "node:assert/strict";
import test from "node:test";
import { createRaidDb, handleRaids } from "./raids.js";

test("raid routes explain a missing Supabase setup", async () => {
  const db = createRaidDb({});
  const response = mockResponse();
  const handled = await handleRaids(request({ method: "GET", url: "/api/raids" }), response, db, store());
  assert.equal(handled, true);
  assert.equal(response.statusCode, 503);
  assert.match(JSON.parse(response.body).error, /SUPABASE_URL/);
});

test("opening a raid requires an X session", async () => {
  const response = mockResponse();
  await handleRaids(request({
    method: "POST",
    url: "/api/raids",
    body: draft(),
  }), response, memoryDb(), store());
  assert.equal(response.statusCode, 401);
});

test("a signed-in account can open a raid and record one reply", async () => {
  const db = memoryDb();
  const auth = store();
  const opened = mockResponse();
  await handleRaids(request({
    method: "POST",
    url: "/api/raids",
    cookie: "npaid_sid=abc",
    body: draft(),
  }), opened, db, auth);
  assert.equal(opened.statusCode, 201);
  const raid = JSON.parse(opened.body).raid;
  assert.equal(raid.author, "npaid");

  const denied = mockResponse();
  await handleRaids(request({
    method: "POST",
    url: `/api/raids/${raid.id}/claims`,
    cookie: "npaid_sid=abc",
    body: { template: draft().templates[0], replyUrl: "https://x.com/ada/status/99" },
  }), denied, db, auth);
  assert.equal(denied.statusCode, 400);

  auth.links["user-1"] = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
  const recorded = mockResponse();
  await handleRaids(request({
    method: "POST",
    url: `/api/raids/${raid.id}/claims`,
    cookie: "npaid_sid=abc",
    body: { template: draft().templates[0], replyUrl: "https://x.com/ada/status/99" },
  }), recorded, db, auth);
  assert.equal(recorded.statusCode, 201);
  assert.equal(JSON.parse(recorded.body).raid.claims.length, 1);
});

test("an empty Supabase project receives the sample raids", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || "GET", body: options.body || "" });
    if (calls.length === 1) return json([]);
    if (options.method === "POST") return json([]);
    return json([{
      id: "seed-launch",
      title: "Back the launch thread",
      tweet_url: "https://x.com/npaid/status/20",
      tweet_id: "20",
      author: "npaid",
      note: "",
      pool_milli: 2500,
      reward_milli: 10,
      ends_at: new Date().toISOString(),
      templates: ["Clean work. Keep going."],
      sample: true,
      claims: [],
    }]);
  };
  const db = createRaidDb({
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
  }, fetchImpl);
  const raids = await db.list();
  assert.equal(raids[0].id, "seed-launch");
  assert.match(calls[1].url, /\/rest\/v1\/raids/);
  assert.match(calls[1].body, /seed-launch/);
  assert.equal(calls[1].body.includes("service-role-test"), false);
});

function draft() {
  return {
    title: "Back the launch",
    tweetUrl: "https://x.com/npaid/status/20",
    pool: "1",
    reward: "0.01",
    hours: "24",
    templates: ["Keep going. This is worth seeing."],
  };
}

function store() {
  return {
    sessions: { abc: { userId: "user-1", username: "ada" } },
    links: {},
  };
}

function memoryDb() {
  const raids = [];
  return {
    ready: true,
    async list() {
      return raids;
    },
    async insertRaid(raid) {
      const next = { ...raid, claims: [] };
      raids.unshift(next);
      return next;
    },
    async insertClaim(raidId, claim) {
      const raid = raids.find((item) => item.id === raidId);
      raid.claims.push(claim);
      return { raid };
    },
  };
}

function request({ method, url, cookie = "", body }) {
  const encoded = body ? Buffer.from(JSON.stringify(body)) : null;
  return {
    method,
    url,
    headers: { cookie },
    async *[Symbol.asyncIterator]() {
      if (encoded) yield encoded;
    },
  };
}

function mockResponse() {
  return {
    statusCode: 0,
    body: "",
    setHeader() {},
    end(payload) {
      this.body = payload;
    },
  };
}

function json(body) {
  return {
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify(body);
    },
  };
}
