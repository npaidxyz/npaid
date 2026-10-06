import { randomUUID } from "node:crypto";
import { checkClaim, checkRaidDraft, seedState } from "../src/npaid.js";
import { currentSession } from "./xAuth.js";

const SETUP = "Shared raids need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.";

export function createRaidDb(env, fetchImpl = globalThis.fetch) {
  const url = String(env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  if (!url || !key) return { ready: false };

  async function query(path, { method = "GET", body, prefer } = {}) {
    const response = await fetchImpl(`${url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body,
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const error = new Error(payload?.message || "Could not reach the raid store.");
      error.status = response.status;
      error.code = payload?.code;
      throw error;
    }
    return payload;
  }

  return {
    ready: true,
    async list() {
      await ensureSamples(query);
      const rows = await query("raids?select=*,claims(*)&order=created_at.desc");
      return (rows ?? []).map(fromRow);
    },
    async insertRaid(raid, createdBy) {
      const [row] = await query("raids", {
        method: "POST",
        prefer: "return=representation",
        body: JSON.stringify([{ ...toRow(raid), created_by: createdBy }]),
      });
      return fromRow({ ...row, claims: [] });
    },
    async insertClaim(raidId, claim) {
      try {
        await query("claims", {
          method: "POST",
          prefer: "return=minimal",
          body: JSON.stringify([toClaimRow(raidId, claim)]),
        });
      } catch (error) {
        if (error.code === "23505") {
          return { error: "This account or wallet is already recorded on this raid." };
        }
        throw error;
      }
      const [row] = await query(`raids?id=eq.${encodeURIComponent(raidId)}&select=*,claims(*)`);
      return { raid: fromRow(row) };
    },
  };
}

export function raidsPlugin(env, store) {
  const db = createRaidDb(env);
  return {
    name: "raids",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleRaids(req, res, db, store);
          if (!handled) next();
        } catch (error) {
          const message = error instanceof Error && error.message ? error.message : "Could not reach the raid store.";
          sendJson(res, 500, { error: message });
        }
      });
    },
  };
}

export async function handleRaids(req, res, db, store) {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/raids")) return false;
  if (!db.ready) {
    sendJson(res, 503, { error: SETUP });
    return true;
  }
  if (url.pathname === "/api/raids" && req.method === "GET") {
    sendJson(res, 200, { raids: await db.list() });
    return true;
  }
  if (url.pathname === "/api/raids" && req.method === "POST") {
    const session = currentSession(req, store);
    if (!session) {
      sendJson(res, 401, { error: "Sign in with X first." });
      return true;
    }
    const checked = checkRaidDraft(await readJson(req));
    if (checked.error) {
      sendJson(res, 400, { error: checked.error });
      return true;
    }
    const raid = await db.insertRaid(checked.raid, session.userId);
    sendJson(res, 201, { raid });
    return true;
  }
  const claimMatch = url.pathname.match(/^\/api\/raids\/([^/]+)\/claims$/);
  if (claimMatch && req.method === "POST") {
    const session = currentSession(req, store);
    if (!session) {
      sendJson(res, 401, { error: "Sign in with X first." });
      return true;
    }
    const raidId = decodeURIComponent(claimMatch[1]);
    const raids = await db.list();
    const raid = raids.find((item) => item.id === raidId);
    const linked = store.links[session.userId] || "";
    const checked = checkClaim(raid, {
      xUserId: session.userId,
      handle: String(session.username || "").toLowerCase(),
      wallet: linked,
      linkedWallet: linked,
    }, await readJson(req));
    if (checked.error) {
      sendJson(res, 400, { error: checked.error });
      return true;
    }
    const saved = await db.insertClaim(raidId, checked.claim);
    if (saved.error) {
      sendJson(res, 409, { error: saved.error });
      return true;
    }
    sendJson(res, 201, { raid: saved.raid });
    return true;
  }
  sendJson(res, 404, { error: "Not found." });
  return true;
}

async function ensureSamples(query) {
  const existing = await query("raids?select=id&limit=1");
  if (existing?.length) return;
  const raids = seedState().raids;
  await query("raids?on_conflict=id", {
    method: "POST",
    prefer: "return=minimal,resolution=ignore-duplicates",
    body: JSON.stringify(raids.map((raid) => toRow(raid))),
  });
  const claims = raids.flatMap((raid) => raid.claims.map((claim) => toClaimRow(raid.id, claim)));
  if (claims.length === 0) return;
  try {
    await query("claims?on_conflict=id", {
      method: "POST",
      prefer: "return=minimal,resolution=ignore-duplicates",
      body: JSON.stringify(claims),
    });
  } catch (error) {
    if (error.code !== "23505") throw error;
  }
}

function toRow(raid) {
  return {
    id: raid.id,
    title: raid.title,
    tweet_url: raid.tweetUrl,
    tweet_id: raid.tweetId,
    author: raid.author,
    note: raid.note || "",
    pool_milli: raid.poolMilli,
    reward_milli: raid.rewardMilli,
    ends_at: raid.endsAt,
    templates: raid.templates,
    sample: Boolean(raid.sample),
  };
}

function toClaimRow(raidId, claim) {
  return {
    id: claim.id || randomUUID(),
    raid_id: raidId,
    handle: claim.handle,
    wallet: claim.wallet,
    template: claim.template,
    reply_url: claim.replyUrl,
    created_at: claim.at,
  };
}

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    tweetUrl: row.tweet_url,
    tweetId: row.tweet_id,
    author: row.author,
    note: row.note || "",
    poolMilli: row.pool_milli,
    rewardMilli: row.reward_milli,
    endsAt: row.ends_at,
    templates: row.templates,
    sample: Boolean(row.sample),
    claims: (row.claims ?? []).map((claim) => ({
      handle: claim.handle,
      wallet: claim.wallet,
      template: claim.template,
      replyUrl: claim.reply_url,
      at: claim.created_at,
    })),
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
