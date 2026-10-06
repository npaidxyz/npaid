import { createPublicKey, verify } from "node:crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function decodeBase58(value) {
  const bytes = [];
  for (const char of String(value ?? "")) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) return null;
    let carry = digit;
    for (let index = 0; index < bytes.length; index += 1) {
      carry += bytes[index] * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of String(value)) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return Buffer.from(bytes.reverse());
}

export function verifySolanaSignature(message, signatureBase64, wallet) {
  const publicKey = decodeBase58(wallet);
  const signature = Buffer.from(String(signatureBase64 ?? ""), "base64");
  if (!publicKey || publicKey.length !== 32 || signature.length !== 64) return false;
  try {
    const key = createPublicKey({
      key: { crv: "Ed25519", kty: "OKP", x: publicKey.toString("base64url") },
      format: "jwk",
    });
    return verify(null, Buffer.from(message), key, signature);
  } catch {
    return false;
  }
}

export function bindWallet(links, userId, wallet) {
  const current = links[userId];
  if (current && current !== wallet) {
    return { error: "This X account is already linked to another wallet." };
  }
  const owner = Object.entries(links).find(([, address]) => address === wallet);
  if (owner && owner[0] !== userId) {
    return { error: "This wallet is already linked to another X account." };
  }
  return { links: { ...links, [userId]: wallet } };
}
