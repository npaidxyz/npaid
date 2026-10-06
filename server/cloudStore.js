import { createStore } from "./xAuth.js";

const SETUP = "Run the sessions and wallet_links tables from supabase/schema.sql.";

export async function openStore(env, fetchImpl = globalThis.fetch) {
  const url = String(env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  if (!url || !key) return createStore("");
  return createCloudStore(url, key, fetchImpl);
}

async function createCloudStore(url, key, fetchImpl) {
  const sessions = {};
  const links = {};

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
      const missing = payload?.code === "PGRST205";
      const error = new Error(missing ? SETUP : payload?.message || "Could not reach the session store.");
      error.status = missing ? 503 : response.status;
      throw error;
    }
    return payload;
  }

  const sessionRows = await query("sessions?select=id,payload");
  for (const row of sessionRows ?? []) sessions[row.id] = row.payload;
  const linkRows = await query("wallet_links?select=user_id,wallet");
  for (const row of linkRows ?? []) links[row.user_id] = row.wallet;

  return {
    get sessions() {
      return sessions;
    },
    get links() {
      return links;
    },
    async writeSession(id, value) {
      sessions[id] = value;
      await query("sessions?on_conflict=id", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify([{ id, payload: value, updated_at: new Date().toISOString() }]),
      });
    },
    async deleteSession(id) {
      delete sessions[id];
      await query(`sessions?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    async writeLinks(next) {
      const previous = { ...links };
      for (const userId of Object.keys(links)) delete links[userId];
      Object.assign(links, next);
      const rows = Object.entries(next).map(([user_id, wallet]) => ({
        user_id,
        wallet,
        updated_at: new Date().toISOString(),
      }));
      if (rows.length) {
        await query("wallet_links?on_conflict=user_id", {
          method: "POST",
          prefer: "resolution=merge-duplicates,return=minimal",
          body: JSON.stringify(rows),
        });
      }
      for (const userId of Object.keys(previous)) {
        if (next[userId]) continue;
        await query(`wallet_links?user_id=eq.${encodeURIComponent(userId)}`, { method: "DELETE" });
      }
    },
  };
}
