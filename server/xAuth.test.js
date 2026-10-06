import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { bindWallet, decodeBase58, verifySolanaSignature } from "./solana.js";
import { createStore, handleXAuth } from "./xAuth.js";

test("base58 decodes 32 zero bytes", () => {
  const decoded = decodeBase58("1".repeat(32));
  assert.equal(decoded?.length, 32);
  assert.ok(decoded.every((byte) => byte === 0));
});

test("a Phantom-style signature verifies only for the signing wallet", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url");
  const wallet = encodeBase58(raw);
  const message = "NPaid\nLink this X account to this wallet.\nAccount: 1\nWallet: " + wallet + "\nNonce: abc";
  const signature = sign(null, Buffer.from(message), privateKey).toString("base64");
  assert.equal(verifySolanaSignature(message, signature, wallet), true);
  assert.equal(verifySolanaSignature(message, signature, "1".repeat(32)), false);
  assert.equal(verifySolanaSignature("other message", signature, wallet), false);
});

test("one X account binds to one wallet", () => {
  const first = bindWallet({}, "user-a", "WalletA");
  assert.equal(first.error, undefined);
  const same = bindWallet(first.links, "user-a", "WalletA");
  assert.equal(same.links["user-a"], "WalletA");
  const moved = bindWallet(first.links, "user-a", "WalletB");
  assert.match(moved.error, /another wallet/);
  const taken = bindWallet(first.links, "user-b", "WalletA");
  assert.match(taken.error, /another X account/);
});

test("link route rejects a signature for a different wallet", async () => {
  const store = createStore("");
  store.writeSession("sid", {
    userId: "user-a",
    username: "budi",
    expiresAt: Date.now() + 60_000,
    pending: {
      wallet: "1".repeat(32),
      message: "NPaid\nnope",
      expiresAt: Date.now() + 60_000,
    },
  });
  const res = fakeRes();
  await handleXAuth(fakeReq("POST", "/api/x/link", { signature: Buffer.alloc(64).toString("base64") }, "npaid_sid=sid"), res, {}, store);
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /does not match/);
});

function encodeBase58(bytes) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let zeroes = 0;
  while (zeroes < bytes.length && bytes[zeroes] === 0) zeroes += 1;
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let index = 0; index < digits.length; index += 1) {
      carry += digits[index] << 8;
      digits[index] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  return "1".repeat(zeroes) + digits.reverse().map((digit) => alphabet[digit]).join("");
}

function fakeReq(method, url, body, cookie) {
  const payload = JSON.stringify(body);
  return {
    method,
    url,
    headers: { cookie },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(payload);
    },
  };
}

function fakeRes() {
  return {
    statusCode: 0,
    body: "",
    setHeader() {},
    end(body) {
      this.body = body || "";
    },
  };
}
