import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { consumeNonce } from "~~/lib/nonceStore";

const client = createPublicClient({ chain: baseSepolia, transport: http() });

export async function POST(req: NextRequest) {
  try {
    const { address, message, signature, nonce } = await req.json();

    if (!address || !message || !signature || !nonce) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    // 1) Checa reuse do nonce (principal proteção anti-replay)
    if (!consumeNonce(nonce)) {
      return NextResponse.json({ error: "invalid or reused nonce" }, { status: 400 });
    }

    // 2) Verifica a assinatura SIWE (Viem suporta ERC-6492 wrapper)
    const valid = await client.verifyMessage({ address, message, signature });
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    // 3) Tudo ok → crie a sessão/JWT aqui (MVP: só ok)
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "verify failed" }, { status: 500 });
  }
}
