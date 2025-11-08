import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "~~/lib/jwt";
import { prisma } from "~~/lib/prisma";

export const runtime = "nodejs";

type Presence = {
  at: string;
  videoId: string | null;
  watchSeconds: number;
  like: boolean | null;
  dislike?: boolean | null;
  subscribed?: boolean | null;
  channelName?: string | null;
  channelHandle?: string | null;
  channelId?: string | null;
  recent?: Array<{ type: string; at: string }>;
};

function isPresence(x: any): x is Presence {
  return x && typeof x.at === "string" && typeof x.watchSeconds === "number" && "videoId" in x;
}

export async function POST(req: NextRequest) {
  // 1) Auth (JWT no header)
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return NextResponse.json({ error: "missing_bearer", action: "reauth" }, { status: 401 });
  }

  const check = verifyJWT(m[1], process.env.JWT_SECRET!);
  if (!check.ok) {
    return NextResponse.json({ error: "invalid_token", action: "reauth" }, { status: 401 });
  }
  if (check.payload.scope !== "extension") {
    return NextResponse.json({ error: "forbidden_scope" }, { status: 403 });
  }
  const userAddress = (check.payload.sub as string).toLowerCase();

  // 2) Body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (!isPresence(body)) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const atTs = Date.parse(body.at);
  if (Number.isNaN(atTs)) {
    return NextResponse.json({ error: "bad_timestamp" }, { status: 400 });
  }

  // (Opcional) Freshness
  if (Math.abs(Date.now() - atTs) > 10 * 60_000) {
    // Você pode rejeitar ou só marcar nos logs.
    // return NextResponse.json({ error: "stale_event" }, { status: 422 });
  }

  // 3) Resolve/Cria o usuário pelo baseAccountAddress
  let user = await prisma.user.findUnique({
    where: { baseAccountAddress: userAddress },
    select: { id: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        baseAccountAddress: userAddress,
      },
      select: { id: true },
    });
  }

  // 4) Idempotência por (userId, channelId, videoId)
  const channelId = body.channelId ?? "unknown";
  const videoId = body.videoId ?? "unknown";

  try {
    const tip = await prisma.tip.upsert({
      where: {
        userId_channelId_videoId: {
          userId: user.id,
          channelId,
          videoId,
        },
      },
      create: {
        userId: user.id,
        channelId,
        channelHandle: body.channelHandle ?? null,
        channelName: body.channelName ?? null,
        videoId,
        watchSeconds: Math.floor(body.watchSeconds),
        like: body.like ?? null,
        dislike: body.dislike ?? null,
        subscribed: body.subscribed ?? null,
        payload: body as any,
      },
      update: {
        // se quiser “atualizar” um registro existente (ex.: aumentar watchSeconds), faça aqui:
        // ex.: pega o maior watchSeconds que chegou
        watchSeconds: Math.max(Math.floor(body.watchSeconds), 0),
        like: body.like ?? null,
        dislike: body.dislike ?? null,
        subscribed: body.subscribed ?? null,
        payload: body as any,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, tipId: tip.id });
  } catch (e: any) {
    // Se der unique constraint violation (corrida), trate como OK idempotente
    const msg = String(e?.message || "");
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      return NextResponse.json({ ok: true, already: true });
    }
    console.error("[webhook] persist error", e);
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }
}
