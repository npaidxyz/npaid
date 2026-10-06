export async function fetchMe() {
  try {
    const response = await fetch("/api/x/me");
    if (response.status === 401) return null;
    if (!response.ok) return undefined;
    const payload = await response.json();
    if (!payload?.userId || !payload?.username) return null;
    return payload;
  } catch {
    return undefined;
  }
}

export async function logoutX() {
  await fetch("/api/x/logout", { method: "POST" });
}

export async function requestLinkMessage(wallet) {
  const response = await fetch("/api/x/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not start the wallet link.");
  return payload.message;
}

export async function submitLink(signature) {
  const response = await fetch("/api/x/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signature }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not link the wallet.");
  return payload;
}
