// Password hashing with Node's built-in scrypt (no native deps, no "$" signs —
// so the hash can be pasted into a .env file or the Vercel dashboard as-is).
//
// Format:  scrypt:<N>:<r>:<p>:<salt base64url>:<hash base64url>
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const DEFAULTS = { N: 32768, r: 8, p: 1 };
const KEY_LEN = 32;
const MAX_MEM = 64 * 1024 * 1024;

function derive(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keylen, { ...opts, maxmem: MAX_MEM }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEY_LEN, DEFAULTS);
  const { N, r, p } = DEFAULTS;
  return ["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join(":");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.trim().split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64url");
  if (expected.length < 16) return false;
  try {
    const actual = await derive(password, Buffer.from(saltB64, "base64url"), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
