// src/app/api/user/link-subaccount/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";

export const runtime = "nodejs"; // garante Node runtime (não Edge)

export async function POST(req: NextRequest) {
  const { subAccountAddress, baseAccountAddress, userId } = await req.json();

  if (!userId || !baseAccountAddress || !subAccountAddress) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // upsert do usuário
  const user = await prisma.user.upsert({
    where: { baseAccountAddress },
    update: { subAccountAddress },
    create: {
      id: userId,
      baseAccountAddress,
      subAccountAddress,
    },
  });

  return NextResponse.json({ ok: true, user });
}
