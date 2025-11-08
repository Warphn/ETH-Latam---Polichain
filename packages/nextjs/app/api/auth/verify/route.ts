// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { type Address, createPublicClient, http, isAddress, recoverMessageAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { signJWT } from "~~/lib/jwt";

export const runtime = "nodejs";

type VerifyBody = {
  address: `0x${string}`;
  message: string;
  signature: `0x${string}` | { signature: `0x${string}` }; // às vezes vem como objeto
  nonce: string;
};

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(), // usa seu RPC padrão; pode trocar por ALCHEMY/INFURA se quiser
});

function extractNonceFromMessage(message: string) {
  const line = message.split("\n").find(l => l.startsWith("Nonce: "));
  return line?.slice("Nonce: ".length).trim() || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<VerifyBody>;
    const address = body.address as Address;
    const message = body.message as string;
    // normaliza assinatura (string)
    const signature = (
      typeof body.signature === "string" ? body.signature : (body.signature as any)?.signature
    ) as `0x${string}`;
    const nonceFromClient = (body.nonce || "").trim();

    // valida campos
    if (!address || !message || !signature) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    if (!isAddress(address)) {
      return NextResponse.json({ error: "bad_address" }, { status: 400 });
    }

    // cookie nonce
    const cookieNonce = req.cookies.get("login_nonce")?.value?.trim();
    if (!cookieNonce) {
      return NextResponse.json({ error: "missing_cookie_nonce" }, { status: 400 });
    }

    // nonce dentro da mensagem
    const nonceInMessage = extractNonceFromMessage(message);
    if (!nonceInMessage) {
      const res = NextResponse.json({ error: "nonce_not_found_in_message" }, { status: 400 });
      res.cookies.set("login_nonce", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
      return res;
    }

    // compara cookie vs mensagem e (se enviado) cookie vs client
    if (cookieNonce !== nonceInMessage) {
      const res = NextResponse.json(
        { error: "nonce_mismatch_cookie_vs_msg", cookieNonce, nonceInMessage },
        { status: 400 },
      );
      res.cookies.set("login_nonce", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
      return res;
    }
    if (nonceFromClient && nonceFromClient !== cookieNonce) {
      const res = NextResponse.json(
        { error: "nonce_mismatch_cookie_vs_client", cookieNonce, nonceFromClient },
        { status: 400 },
      );
      res.cookies.set("login_nonce", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
      return res;
    }

    // ===== Verificação da assinatura =====
    // 1) Tenta viem.verifyMessage (suporta ERC-6492 e variações)
    let verified = false;
    try {
      verified = await client.verifyMessage({ address, message, signature });
    } catch (e) {
      console.log(e);
      // ignora aqui – vamos tentar recover em seguida com erro detalhado se falhar
    }

    // 2) Se verifyMessage não passou, tenta recoverMessageAddress (assinaturas "cruas")
    if (!verified) {
      try {
        const recovered = (await recoverMessageAddress({ message, signature })) as Address;
        if (recovered.toLowerCase() !== address.toLowerCase()) {
          const res = NextResponse.json({ error: "address_mismatch", recovered, address }, { status: 401 });
          res.cookies.set("login_nonce", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
          return res;
        }
        verified = true;
      } catch (e: any) {
        const res = NextResponse.json({ error: "recover_failed", detail: String(e?.message ?? e) }, { status: 400 });
        res.cookies.set("login_nonce", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
        return res;
      }
    }

    if (!verified) {
      const res = NextResponse.json({ error: "verify_failed_generic" }, { status: 400 });
      res.cookies.set("login_nonce", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
      return res;
    }

    // segredo
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const res = NextResponse.json({ error: "missing_jwt_secret" }, { status: 500 });
      res.cookies.set("login_nonce", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
      return res;
    }

    // JWT 1h
    const token = signJWT({ sub: address, scope: "extension" }, secret, 3600);

    // ok + limpa cookie
    const res = NextResponse.json({ ok: true, token });
    res.cookies.set("login_nonce", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    return res;
  } catch (e: any) {
    console.error("[/api/auth/verify] unexpected", e);
    return NextResponse.json({ error: "verify_failed", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
