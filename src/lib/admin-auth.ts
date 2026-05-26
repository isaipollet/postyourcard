const SESSION_TTL_SECONDS = 60 * 60 * 24;

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(secret: string): Promise<string> {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(12))),
  };
  const payloadB64 = b64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const key = await importKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64))
  );
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

export async function verifySession(
  token: string,
  secret: string
): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  let sig: Uint8Array;
  try {
    sig = b64urlDecode(sigB64);
  } catch {
    return false;
  }

  const key = await importKey(secret);
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64))
  );
  if (!timingSafeEqual(sig, expected)) return false;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payloadB64))
    ) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS;
