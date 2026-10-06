import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { createRaidDb, handleRaids } from "./raids.js";
import { createStore, handleXAuth } from "./xAuth.js";

loadEnvFile();

const port = Number(process.env.PORT) || 8080;
const root = resolve(process.cwd(), "dist");
const store = createStore(process.env.DATA_DIR || join(process.cwd(), "data"));
const db = createRaidDb(process.env);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  try {
    if (await handleXAuth(req, res, process.env, store)) return;
    if (await handleRaids(req, res, db, store)) return;
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405;
      res.end();
      return;
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    const file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if ((file === root || file.startsWith(`${root}${sep}`)) && existsSync(file) && statSync(file).isFile()) {
      sendFile(req, res, file);
      return;
    }
    sendFile(req, res, join(root, "index.html"));
  } catch {
    if (!res.headersSent) res.statusCode = 500;
    res.end("NPaid failed to respond.");
  }
});

function sendFile(req, res, file) {
  if (!existsSync(file)) {
    res.statusCode = 500;
    res.end("Build the app with npm run build before starting it.");
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
}

server.listen(port, "0.0.0.0", () => {
  console.log(`NPaid listening on ${port}`);
});

function loadEnvFile() {
  const file = join(process.cwd(), ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
