import crypto from "crypto";

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlJson(obj: any) {
  return b64url(Buffer.from(JSON.stringify(obj)));
}

export function signJWT(payload: Record<string, any>, secret: string, expiresInSec: number) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSec, ...payload };
  const h = b64urlJson(header);
  const p = b64urlJson(body);
  const data = `${h}.${p}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  const s = b64url(sig);
  return `${data}.${s}`;
}

export function verifyJWT(token: string, secret: string): { ok: true; payload: any } | { ok: false; error: string } {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, error: "bad token" };
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = b64url(crypto.createHmac("sha256", secret).update(data).digest());
  if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return { ok: false, error: "bad signature" };
  const payload = JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return { ok: false, error: "expired" };
  return { ok: true, payload };
}
