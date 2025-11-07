// app/api/youtube-presence/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("[YouTube Presence] Dados recebidos:", body);

    // Salva no banco
    await prisma.youtubePresence.create({
      data: {
        videoId: body.videoId,
        channelName: body.channelName,
        isPlaying: body.isPlaying,
        subscribed: body.subscribed,
        like: body.like,
        dislike: body.dislike,
        watchSeconds: body.watchSeconds ?? 0,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao salvar no banco:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
