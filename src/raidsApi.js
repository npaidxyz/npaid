export async function fetchRaids() {
  try {
    const response = await fetch("/api/raids");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { error: payload.error || "Could not load raids." };
    return { raids: Array.isArray(payload.raids) ? payload.raids : [] };
  } catch {
    return { error: "Could not load raids." };
  }
}

export async function createRaid(draft) {
  const response = await fetch("/api/raids", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not open the raid.");
  return payload.raid;
}

export async function createClaim(raidId, input) {
  const response = await fetch(`/api/raids/${encodeURIComponent(raidId)}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { error: payload.error || "Could not record the reply." };
  return { raid: payload.raid };
}
