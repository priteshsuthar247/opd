import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

// TOTP (RFC 6238, SHA-1, 30s steps) + secret encryption, dependency-free.
// Secrets rest AES-GCM encrypted with an AUTH_SECRET-derived key — a DB
// leak alone never yields usable TOTP seeds.
const STEP_MS = 30 * 1000;
const DIGITS = 6;

function encKey(): Buffer {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHash("sha256").update(`totp-enc:${secret}`).digest();
}

export function encryptTotpSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${body.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}

export function decryptTotpSecret(stored: string): string | null {
  try {
    const [iv, body, tag] = stored.split(".");
    if (!iv || !body || !tag) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encKey(),
      Buffer.from(iv, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return (
      decipher.update(Buffer.from(body, "base64url"), undefined, "utf8") +
      decipher.final("utf8")
    );
  } catch {
    return null;
  }
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function newTotpSecret(): string {
  let out = "";
  const bytes = randomBytes(20);
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(s: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of s.toUpperCase()) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

// ±1 step window for clock skew. Constant-time compare per candidate.
export function verifyTotpCode(secret: string, code: string): boolean {
  const digits = code.trim();
  if (!/^\d{6}$/.test(digits)) return false;
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / STEP_MS);
  const want = Buffer.from(digits, "utf8");
  for (const c of [counter - 1, counter, counter + 1]) {
    const got = Buffer.from(hotp(key, c), "utf8");
    if (got.length === want.length && timingSafeEqual(got, want)) {
      return true;
    }
  }
  return false;
}

export function totpAuthUrl(
  secret: string,
  account: string,
  issuer = "OPD Clinic"
): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function newBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(5).toString("hex").toUpperCase()
  );
}
