// api/youtube/verify/start

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { resolveChannelId } from "~~/lib/youtube";
import { prisma } from "~~/lib/prisma";
import { getAddress } from "viem";

export const runtime = "nodejs";

const CODE_PREFIX = "yt-verify-";

function normalizeAddress(v?: string | null): string | null {
  if (!v) return null;
  try {
    return getAddress(v as `0x${string}`);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const baseAddrRaw = req.headers.get("x-base-address");
    const subAddrRaw = req.headers.get("x-sub-address");
    const baseAddr = normalizeAddress(baseAddrRaw);
    const subAddr = normalizeAddress(subAddrRaw);

    if (!baseAddr) {
      return NextResponse.json(
        { error: "unauthorized", detail: "x-base-address ausente" },
        { status: 401 },
      );
    }

    // get-or-create do usuário diretamente via prisma
    let user = await prisma.user.findUnique({ where: { baseAccountAddress: baseAddr } });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            baseAccountAddress: baseAddr,
            subAccountAddress: subAddr ?? null,
          },
        });
      } catch (e: any) {
        if (e?.code === "P2002") {
          user = await prisma.user.findUnique({ where: { baseAccountAddress: baseAddr } });
          if (!user) throw e;
        } else {
          throw e;
        }
      }
    } else {
      // atualiza sub se header veio
      if (subAddrRaw !== null) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { subAccountAddress: subAddr ?? null },
          });
        } catch (e: any) {
          if (e?.code === "P2002") {
            return NextResponse.json({ error: "sub_account_taken" }, { status: 409 });
          }
          throw e;
        }
      }
    }

    const body = await req.json().catch(() => ({} as any));
    const input: string | undefined = body?.channel ?? undefined;

    // gera um código curto com prefixo
    const code = CODE_PREFIX + randomBytes(3).toString("hex");

    // resolve opcionalmente o channelId (se o usuário já informou um @handle/URL)
    let intendedChannelId: string | undefined;
    if (input) {
      const r = await resolveChannelId({ input, apiKey: process.env.YOUTUBE_API_KEY! });
      if (r?.channelId) intendedChannelId = r.channelId;
    }

    const rec = await prisma.youtubeVerification.create({
      data: { userId: user.id, code, intendedChannelId },
    });

    return NextResponse.json({
      code: rec.code,
      intendedChannelId: rec.intendedChannelId ?? null,
      instructions: [
        "Abra seu canal do YouTube.",
        "Edite a descrição (About).",
        `Cole este código exatamente: "${rec.code}"`,
        "Salve. Depois clique em 'Verificar agora' no app.",
      ],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "internal_error" }, { status: 500 });
  }
}