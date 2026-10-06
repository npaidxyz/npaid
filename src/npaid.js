const HOUR = 60 * 60 * 1000;

const BANNED = [/n[i1!|]gg+/i];

export function normalizeHandle(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export function validHandle(handle) {
  return /^[a-z0-9_]{1,15}$/.test(handle);
}

export function validWallet(address) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(address ?? "").trim());
}

export function parseTweetUrl(value) {
  try {
    const url = new URL(String(value ?? "").trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "x.com" && host !== "twitter.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const statusAt = parts.indexOf("status");
    if (statusAt < 1) return null;
    const tweetId = (parts[statusAt + 1] ?? "").split("?")[0];
    if (!/^\d{1,25}$/.test(tweetId)) return null;
    const author = parts[statusAt - 1].replace(/^@/, "").toLowerCase();
    if (!validHandle(author)) return null;
    return { tweetId, author, href: `https://x.com/${author}/status/${tweetId}` };
  } catch {
    return null;
  }
}

export function replyIntent(tweetId, text) {
  const params = new URLSearchParams({
    in_reply_to: tweetId,
    text,
  });
  return `https://x.com/intent/post?${params.toString()}`;
}

export function containsAbuse(text) {
  return BANNED.some((pattern) => pattern.test(text));
}

export function solToMilli(value) {
  const amount = Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(amount)) return null;
  const milli = Math.round(amount * 1000);
  if (Math.abs(amount * 1000 - milli) > 0.001) return null;
  return milli;
}

export function formatSol(milli) {
  const sol = milli / 1000;
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(sol) ? 0 : 2,
    maximumFractionDigits: 3,
  }).format(sol)} SOL`;
}

export function shortAddress(address) {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function isOpen(raid, now = Date.now()) {
  return new Date(raid.endsAt).getTime() > now && slotsLeft(raid) > 0;
}

export function slotsLeft(raid) {
  const used = raid.claims.length * raid.rewardMilli;
  return Math.max(0, Math.floor((raid.poolMilli - used) / raid.rewardMilli));
}

export function poolLeft(raid) {
  const used = raid.claims.length * raid.rewardMilli;
  return Math.max(0, raid.poolMilli - used);
}

export function timeLeft(endsAt, now = Date.now()) {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return "closed";
  const hours = Math.floor(ms / HOUR);
  const minutes = Math.floor((ms % HOUR) / 60000);
  if (hours >= 48) return `${Math.floor(hours / 24)} days left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m left`;
  return "less than a minute";
}

export function checkClaim(raid, session, input) {
  if (!raid) return { error: "Raid not found." };
  if (!isOpen(raid)) return { error: "This raid is closed or the pool is empty." };
  if (!session.xUserId || !validHandle(session.handle)) return { error: "Sign in with X first." };
  if (!validWallet(session.wallet) || session.linkedWallet !== session.wallet) {
    return { error: "Link this wallet to your X account first." };
  }
  if (!raid.templates.includes(input.template)) {
    return { error: "Pick one of the encouragement lines." };
  }
  const reply = parseTweetUrl(input.replyUrl);
  if (!reply) return { error: "Paste a reply link from x.com or twitter.com." };
  if (reply.tweetId === raid.tweetId) {
    return { error: "That is the target tweet, not your reply." };
  }
  if (reply.author !== session.handle) {
    return { error: `That link belongs to @${reply.author}. The connected account is @${session.handle}.` };
  }
  const taken = raid.claims.some(
    (claim) => claim.handle === session.handle || claim.wallet === session.wallet,
  );
  if (taken) return { error: "This account or wallet is already recorded on this raid." };
  return {
    claim: {
      handle: session.handle,
      wallet: session.wallet,
      template: input.template,
      replyUrl: reply.href,
      at: new Date().toISOString(),
    },
  };
}

export function checkRaidDraft(draft) {
  const title = draft.title.trim();
  if (title.length < 4 || title.length > 80) {
    return { error: "Raid title must be 4–80 characters." };
  }
  const tweet = parseTweetUrl(draft.tweetUrl);
  if (!tweet) return { error: "Tweet URL must be from x.com or twitter.com and include /status/." };
  const poolMilli = solToMilli(draft.pool);
  const rewardMilli = solToMilli(draft.reward);
  if (poolMilli == null || poolMilli < 1 || poolMilli > 1_000_000) {
    return { error: "Pool must be between 0.001 and 1,000 SOL, with at most 3 decimal places." };
  }
  if (rewardMilli == null || rewardMilli < 1) {
    return { error: "Reward must be at least 0.001 SOL." };
  }
  if (rewardMilli > poolMilli) return { error: "Reward cannot be larger than the pool." };
  const hours = Number(draft.hours);
  if (![6, 12, 24, 48, 72].includes(hours)) return { error: "Pick one of the available durations." };
  const templates = draft.templates.map((line) => line.trim()).filter(Boolean);
  if (templates.length < 1 || templates.length > 5) {
    return { error: "Add 1–5 encouragement lines." };
  }
  if (templates.some((line) => line.length < 8 || line.length > 180)) {
    return { error: "Each line must be 8–180 characters." };
  }
  if (templates.some(containsAbuse)) {
    return { error: "Use a supportive line. Insults cannot be used in a raid." };
  }
  return {
    raid: {
      id: crypto.randomUUID(),
      title,
      tweetUrl: tweet.href,
      tweetId: tweet.tweetId,
      author: tweet.author,
      note: "",
      poolMilli,
      rewardMilli,
      endsAt: new Date(Date.now() + hours * HOUR).toISOString(),
      templates,
      claims: [],
      sample: false,
    },
  };
}

export function seedState() {
  const now = Date.now();
  return {
    wallet: "",
    handle: "",
    xUserId: "",
    linkedWallet: "",
    raids: [
      {
        id: "seed-launch",
        title: "Back the launch thread",
        tweetUrl: "https://x.com/npaid/status/20",
        tweetId: "20",
        author: "npaid",
        note: "Sample campaign. Create your own raid with a real tweet URL.",
        poolMilli: 2500,
        rewardMilli: 10,
        endsAt: new Date(now + 36 * HOUR).toISOString(),
        templates: [
          "Clean work. Keep going.",
          "The idea is clear. Good luck with the launch.",
          "This deserves to be seen.",
        ],
        claims: [],
        sample: true,
      },
      {
        id: "seed-community",
        title: "Reply to the community update",
        tweetUrl: "https://x.com/npaid/status/21",
        tweetId: "21",
        author: "npaid",
        note: "Two slots left. Sample of a pool that is almost empty.",
        poolMilli: 30,
        rewardMilli: 10,
        endsAt: new Date(now + 8 * HOUR).toISOString(),
        templates: [
          "Useful notes. Thanks for sharing.",
          "Keep writing. On to the next part.",
        ],
        claims: [
          {
            handle: "warga",
            wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            template: "Useful notes. Thanks for sharing.",
            replyUrl: "https://x.com/warga/status/21001",
            at: new Date(now - 2 * HOUR).toISOString(),
          },
        ],
        sample: true,
      },
      {
        id: "seed-closed",
        title: "Last week's recap",
        tweetUrl: "https://x.com/npaid/status/18",
        tweetId: "18",
        author: "npaid",
        note: "Sample raid that is already over.",
        poolMilli: 100,
        rewardMilli: 10,
        endsAt: new Date(now - 5 * HOUR).toISOString(),
        templates: ["Thanks for the recap. See you next week."],
        claims: [],
        sample: true,
      },
    ],
  };
}
