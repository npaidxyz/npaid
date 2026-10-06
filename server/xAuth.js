import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bindWallet, verifySolanaSignature } from "./solana.js";

const SESSION_COOKIE = "npaid_sid";
const OAUTH_COOKIE = "npaid_oauth";
const WALLET_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function createStore(directory) {
  if (directory) mkdirSync(directory, { recursive: true });
  const sessionsFile = directory ? join(directory, "sessions.json") : "";
  const linksFile = directory ? join(directory, "links.json") : "";
  const read = (file, fallback) => {
    if (!file) return fallback;
    try {
      return JSON.parse(readFileSync(file, "utf8"));
    } catch {
      return fallback;
    }
  };
  const store = {
    sessions: read(sessionsFile, {}),
    links: read(linksFile, {}),
  };
  const save = (file, value) => {
    if (file) writeFileSync(file, JSON.stringify(value));
  };
  return {
    get sessions() {
      return store.sessions;
    },
    get links() {
      return store.links;
    },
    writeSession(id, value) {
      store.sessions[id] = value;
      save(sessionsFile, store.sessions);
    },
    deleteSession(id) {
      delete store.sessions[id];
      save(sessionsFile, store.sessions);
    },
    writeLinks(links) {
      store.links = links;
      save(linksFile, store.links);
    },
  };
}

export function xAuthPlugin(env, store = createStore(join(process.cwd(), "data"))) {
  return {
    name: "x-auth",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleXAuth(req, res, env, store);
          if (!handled) next();
        } catch {
          sendJson(res, 500, { error: "X sign-in failed." });
        }
      });
    },
  };
}

export async function handleXAuth(req, res, env, store) {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/x")) return false;
  if (url.pathname === "/api/x/start" && req.method === "GET") return start(req, res, env);
  if (url.pathname === "/api/x/callback" && req.method === "GET") return callback(req, res, env, store, url);
  if (url.pathname === "/api/x/me" && req.method === "GET") return me(req, res, env, store);
  if (url.pathname === "/api/x/nonce" && req.method === "POST") return nonce(req, res, store);
  if (url.pathname === "/api/x/link" && req.method === "POST") return link(req, res, store);
  if (url.pathname === "/api/x/logout" && req.method === "POST") return logout(req, res, store);
  sendJson(res, 404, { error: "Not found." });
  return true;
}

function start(req, res, env) {
  const host = req.headers.host || "";
  if (host.startsWith("localhost")) {
    const port = host.includes(":") ? host.slice(host.indexOf(":")) : "";
    res.statusCode = 302;
    res.setHeader("Location", `http://127.0.0.1${port}/api/x/start`);
    res.end();
    return true;
  }
  const configError = missingConfig(env);
  if (configError) {
    sendHtml(res, 500, configError);
    return true;
  }
  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirect = redirectUri(env, req);
  const authorize = new URL("https://x.com/i/oauth2/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", env.X_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", redirect);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  const location = `${authorize.toString()}&scope=${encodeURIComponent("users.read tweet.read offline.access")}`;
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.setHeader("Set-Cookie", cookie(OAUTH_COOKIE, JSON.stringify({ state, verifier, redirect }), 600, req));
  res.end();
  return true;
}

async function callback(req, res, env, store, url) {
  if (url.searchParams.get("error")) {
    redirectAccount(res, "denied", clearCookie(OAUTH_COOKIE, req));
    return true;
  }
  const pending = readOauthCookie(req);
  const code = url.searchParams.get("code");
  if (!pending || pending.state !== url.searchParams.get("state") || !code) {
    redirectAccount(res, "state", clearCookie(OAUTH_COOKIE, req));
    return true;
  }
  const token = await exchangeToken(env, {
    grant_type: "authorization_code",
    code,
    redirect_uri: pending.redirect,
    code_verifier: pending.verifier,
  });
  if (!token?.access_token) {
    redirectAccount(res, "token", clearCookie(OAUTH_COOKIE, req));
    return true;
  }
  const profile = await fetchProfile(token.access_token);
  if (!profile) {
    redirectAccount(res, "token", clearCookie(OAUTH_COOKIE, req));
    return true;
  }
  const id = randomBytes(24).toString("base64url");
  await store.writeSession(id, sessionFromToken(profile, token));
  res.statusCode = 302;
  res.setHeader("Location", "/account");
  res.setHeader("Set-Cookie", [cookie(SESSION_COOKIE, id, 60 * 60 * 24 * 30, req), clearCookie(OAUTH_COOKIE, req)]);
  res.end();
  return true;
}

async function me(req, res, env, store) {
  const session = await liveSession(req, env, store);
  if (!session) {
    sendJson(res, 401, { error: "Sign in with X." });
    return true;
  }
  sendJson(res, 200, {
    userId: session.userId,
    username: session.username,
    wallet: store.links[session.userId] || "",
  });
  return true;
}

async function nonce(req, res, store) {
  const session = currentSession(req, store);
  if (!session) {
    sendJson(res, 401, { error: "Sign in with X first." });
    return true;
  }
  const body = await readJson(req);
  const wallet = String(body.wallet ?? "").trim();
  if (!WALLET_PATTERN.test(wallet)) {
    sendJson(res, 400, { error: "That Solana address is not valid." });
    return true;
  }
  const bound = bindWallet(store.links, session.userId, wallet);
  if (bound.error) {
    sendJson(res, 409, { error: bound.error });
    return true;
  }
  const nonceValue = randomBytes(16).toString("base64url");
  const message = [
    "NPaid",
    "Link this X account to this wallet.",
    `Account: ${session.userId}`,
    `Wallet: ${wallet}`,
    `Nonce: ${nonceValue}`,
  ].join("\n");
  await store.writeSession(session.id, {
    ...session,
    pending: { wallet, message, expiresAt: Date.now() + 5 * 60 * 1000 },
  });
  sendJson(res, 200, { message });
  return true;
}

async function link(req, res, store) {
  const session = currentSession(req, store);
  const pending = session?.pending;
  if (!session || !pending || pending.expiresAt < Date.now()) {
    sendJson(res, 400, { error: "The link request expired. Connect Phantom again." });
    return true;
  }
  const body = await readJson(req);
  const valid = verifySolanaSignature(pending.message, body.signature, pending.wallet);
  if (!valid) {
    sendJson(res, 400, { error: "The wallet signature does not match this X account." });
    return true;
  }
  const bound = bindWallet(store.links, session.userId, pending.wallet);
  if (bound.error) {
    sendJson(res, 409, { error: bound.error });
    return true;
  }
  await store.writeLinks(bound.links);
  await store.writeSession(session.id, { ...session, pending: null });
  sendJson(res, 200, {
    userId: session.userId,
    username: session.username,
    wallet: pending.wallet,
  });
  return true;
}

async function logout(req, res, store) {
  const id = readCookies(req)[SESSION_COOKIE];
  if (id) await store.deleteSession(id);
  res.statusCode = 204;
  res.setHeader("Set-Cookie", clearCookie(SESSION_COOKIE, req));
  res.end();
  return true;
}

async function liveSession(req, env, store) {
  const session = currentSession(req, store);
  if (!session) return null;
  if (session.expiresAt > Date.now() + 60_000) return session;
  if (!session.refreshToken) {
    await store.deleteSession(session.id);
    return null;
  }
  const token = await exchangeToken(env, {
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });
  if (!token?.access_token) {
    await store.deleteSession(session.id);
    return null;
  }
  const next = { ...session, ...sessionFromToken({ id: session.userId, username: session.username }, token) };
  await store.writeSession(session.id, next);
  return next;
}

export function currentSession(req, store) {
  const id = readCookies(req)[SESSION_COOKIE];
  const session = id ? store.sessions[id] : null;
  if (!session) return null;
  return { ...session, id };
}

function sessionFromToken(profile, token) {
  return {
    userId: profile.id,
    username: profile.username,
    accessToken: token.access_token,
    refreshToken: token.refresh_token || "",
    expiresAt: Date.now() + Number(token.expires_in || 7200) * 1000,
    pending: null,
  };
}

async function exchangeToken(env, fields) {
  const body = new URLSearchParams({ ...fields, client_id: env.X_CLIENT_ID });
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString("base64")}`,
    },
    body,
  });
  if (!response.ok) return null;
  return response.json();
}

async function fetchProfile(accessToken) {
  const response = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const payload = await response.json();
  if (!payload?.data?.id || !payload?.data?.username) return null;
  return payload.data;
}

function missingConfig(env) {
  if (env.X_CLIENT_ID && env.X_CLIENT_SECRET) return "";
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>NPaid X setup</title>
<body style="font-family:sans-serif;max-width:42rem;margin:4rem auto;line-height:1.5">
<h1>X sign-in needs API keys</h1>
<p>Add <code>X_CLIENT_ID</code> and <code>X_CLIENT_SECRET</code> to <code>.env</code>, then restart the dev server.</p>
<p>In the X developer portal, set the callback URL to <code>${redirectUri(env, { headers: { host: "localhost:5173" } })}</code> and enable OAuth 2.0 with user read.</p>
</body></html>`;
}

function redirectUri(env, req) {
  if (env.X_REDIRECT_URI) return env.X_REDIRECT_URI;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5173";
  const forwarded = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim();
  const proto = forwarded === "https" ? "https" : "http";
  return `${proto}://${host}/api/x/callback`;
}

function redirectAccount(res, code, setCookie) {
  res.statusCode = 302;
  res.setHeader("Location", `/account?x=${code}`);
  if (setCookie) res.setHeader("Set-Cookie", setCookie);
  res.end();
}

function readOauthCookie(req) {
  const raw = readCookies(req)[OAUTH_COOKIE];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.state || !parsed.verifier || !parsed.redirect) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    out[name] = decodeURIComponent(part.slice(separator + 1).trim());
  }
  return out;
}

function cookie(name, value, maxAge, req) {
  return `${name}=${encodeURIComponent(value)}; ${cookieAttrs(req)}; Max-Age=${maxAge}`;
}

function clearCookie(name, req) {
  return `${name}=; ${cookieAttrs(req)}; Max-Age=0`;
}

function cookieAttrs(req) {
  const proto = String(req?.headers?.["x-forwarded-proto"] ?? "").split(",")[0].trim();
  const secure = proto === "https" ? "; Secure" : "";
  return `HttpOnly; Path=/; SameSite=Lax${secure}`;
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

function sendHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}
