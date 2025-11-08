import { NextResponse } from "next/server";
import crypto from "crypto";

function issueNonce() {
  return crypto.randomBytes(16).toString("hex"); // 32 hex
}

async function issue() {
  const nonce = issueNonce();
  const res = NextResponse.json({ nonce });

  // cookie HttpOnly com TTL curto (5 min). Ajuste domain/secure se necessário.
  res.cookies.set("login_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });

  return res;
}

export const GET = issue;
export const POST = issue; // se você chamar por POST, evita 405
