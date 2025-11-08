import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "~~/lib/jwt";
import { prisma } from "~~/lib/prisma";

export const runtime = "nodejs";

/** Seta CORS aberto (sem credentials) */
function withOpenCors(req: NextRequest, res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    req.headers.get("access-control-request-headers") || "*",
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

/** Helper para responder JSON + CORS */
function jsonCors(req: NextRequest, data: unknown, status = 200) {
  const res = new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
  return withOpenCors(req, res);
}

/** Preflight (CORS) */
export async function OPTIONS(req: NextRequest) {
  return withOpenCors(req, new NextResponse(null, { status: 204 }));
}

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
    return jsonCors(req, { error: "missing_bearer", action: "reauth" }, 401);
  }

  const check = verifyJWT(m[1], process.env.JWT_SECRET!);
  if (!check.ok) {
    return jsonCors(req, { error: "invalid_token", action: "reauth" }, 401);
  }
  if (check.payload.scope !== "extension") {
    return jsonCors(req, { error: "forbidden_scope" }, 403);
  }
  const userAddress = (check.payload.sub as string).toLowerCase();

  // 2) Body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonCors(req, { error: "bad_json" }, 400);
  }

  if (!isPresence(body)) {
    return jsonCors(req, { error: "bad_payload" }, 400);
  }

  const atTs = Date.parse(body.at);
  if (Number.isNaN(atTs)) {
    return jsonCors(req, { error: "bad_timestamp" }, 400);
  }

  // (Opcional) Freshness — apenas log; se quiser rejeitar, descomente o return
  if (Math.abs(Date.now() - atTs) > 10 * 60_000) {
    // return jsonCors(req, { error: "stale_event" }, 422);
  }

  // 3) Resolve/Cria o usuário pelo baseAccountAddress
  let user = await prisma.user.findUnique({
    where: { baseAccountAddress: userAddress },
    select: { id: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { baseAccountAddress: userAddress },
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
        // exemplo: manter o maior watchSeconds
        watchSeconds: Math.max(Math.floor(body.watchSeconds), 0),
        like: body.like ?? null,
        dislike: body.dislike ?? null,
        subscribed: body.subscribed ?? null,
        payload: body as any,
      },
      select: { id: true, createdAt: true },
    });

    return jsonCors(req, { ok: true, tipId: tip.id }, 200);
  } catch (e: any) {
    // Idempotente em caso de corrida
    const msg = String(e?.message || "");
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      return jsonCors(req, { ok: true, already: true }, 200);
    }
    console.error("[webhook] persist error", e);
    return jsonCors(req, { error: "persist_failed" }, 500);
  }
}