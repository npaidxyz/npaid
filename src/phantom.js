export function phantomProvider() {
  const provider = window.phantom?.solana ?? window.solana;
  if (provider?.isPhantom) return provider;
  return null;
}

export async function connectPhantom() {
  const provider = phantomProvider();
  if (!provider) {
    window.open("https://phantom.app/download", "_blank", "noopener,noreferrer");
    throw new Error("Phantom is not installed. The download page is open.");
  }
  const response = await provider.connect();
  return response.publicKey.toString();
}

export async function signPhantomMessage(message) {
  const provider = phantomProvider();
  if (!provider) throw new Error("Phantom is not installed. The download page is open.");
  const signed = await provider.signMessage(new TextEncoder().encode(message), "utf8");
  const bytes = signed.signature instanceof Uint8Array ? signed.signature : new Uint8Array(signed.signature);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export async function trustedPhantom() {
  const provider = phantomProvider();
  if (!provider) return "";
  try {
    const response = await provider.connect({ onlyIfTrusted: true });
    return response.publicKey.toString();
  } catch {
    return "";
  }
}
