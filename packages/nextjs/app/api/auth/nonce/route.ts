import { NextResponse } from "next/server";
import crypto from "crypto";
import { addNonce } from "~~/lib/nonceStore";

export async function GET() {
  const nonce = crypto.randomBytes(16).toString("hex"); // 32 chars hex
  addNonce(nonce);
  return new NextResponse(nonce, { status: 200 });
}
