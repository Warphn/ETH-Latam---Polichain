import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";
import { getAddress } from "viem";
import { fetchChannelBranding, resolveChannelId } from "~~/lib/youtube";

export const runtime = "nodejs";

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
    // 0) Auth básico via headers
    const baseAddrRaw = req.headers.get("x-base-address");
    const subAddrRaw = req.headers.get("x-sub-address");
    const baseAddr = normalizeAddress(baseAddrRaw);
    const subAddr = normalizeAddress(subAddrRaw);
    if (!baseAddr) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 1) Buscar/criar usuário por baseAccountAddress e (se veio no header) atualizar subAccountAddress
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
        // Corrida: alguém criou entre o find e o create
        if (e?.code === "P2002") {
          user = await prisma.user.findUnique({ where: { baseAccountAddress: baseAddr } });
          if (!user) throw e;
        } else {
          throw e;
        }
      }
    } else {
      // Atualiza sub se o header veio (mesmo que vazio → zera)
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

    // 2) Body
    const { code, channel, channelId } = await req.json();
    if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });
    if (!channel && !channelId)
      return NextResponse.json({ error: "missing_channel" }, { status: 400 });

    // 3) Verificação de código pendente e pertencente ao usuário
    const rec = await prisma.youtubeVerification.findUnique({ where: { code } });
    if (!rec || rec.status !== "PENDING") {
      return NextResponse.json({ error: "invalid_or_consumed_code" }, { status: 400 });
    }
    if (rec.userId !== user.id) {
      return NextResponse.json({ error: "code_not_owned" }, { status: 403 });
    }

    // 4) Resolver channelId se necessário
    const apiKey = process.env.YOUTUBE_API_KEY!;
    let finalChannelId: string | undefined = channelId;
    if (!finalChannelId) {
      const r = await resolveChannelId({ input: String(channel), apiKey });
      if (!r?.channelId) return NextResponse.json({ error: "channel_not_found" }, { status: 404 });
      finalChannelId = r.channelId;
    }

    // 5) Buscar branding e conferir se a descrição contém o código
    const branding = await fetchChannelBranding({ channelId: finalChannelId, apiKey });
    if (!branding) return NextResponse.json({ error: "youtube_api_error" }, { status: 502 });

    if (!(branding.description ?? "").includes(code)) {
      return NextResponse.json({
        ok: false,
        found: false,
        hint:
          "Código não encontrado na descrição do canal. Aguarde alguns segundos e tente novamente.",
      });
    }

    // 6) Consumir o código e vincular youtubeId ao usuário
    await prisma.$transaction([
      prisma.youtubeVerification.update({
        where: { code },
        data: {
          status: "VERIFIED",
          consumedAt: new Date(),
          verifiedChannelId: finalChannelId,
          verifiedChannelName: branding.title ?? null,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { youtubeId: finalChannelId },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      channelId: finalChannelId,
      channelTitle: branding.title ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "internal_error" }, { status: 500 });
  }
}