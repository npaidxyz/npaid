import { openStore } from "./cloudStore.js";
import { createRaidDb, handleRaids } from "./raids.js";
import { handleXAuth } from "./xAuth.js";

export async function handleVercel(req, res, kind) {
  try {
    const store = await openStore(process.env);
    const handled =
      kind === "raids"
        ? await handleRaids(req, res, createRaidDb(process.env), store)
        : await handleXAuth(req, res, process.env, store);
    if (!handled && !res.headersSent) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not found." }));
    }
  } catch (error) {
    if (res.headersSent) return;
    const message = error instanceof Error && error.message ? error.message : "NPaid failed to respond.";
    res.statusCode = error.status || 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: message }));
  }
}

export function keepQuery(req, pathname) {
  const raw = String(req.url || "");
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  req.url = `${pathname}${query}`;
}
