import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";
import { getAddress } from "viem";

export const runtime = "nodejs";

function norm(v?: string | null): string | null {
  if (!v) return null;
  try {
    return getAddress(v as `0x${string}`);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId: string | undefined = body?.userId;
    const baseRaw: string | undefined = body?.baseAccountAddress;
    const subRaw: string | undefined = body?.subAccountAddress;

    if (!baseRaw || !subRaw) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const base = norm(baseRaw);
    const sub = norm(subRaw);
    if (!base || !sub) {
      return NextResponse.json({ error: "invalid_address" }, { status: 400 });
    }

    // monta createData: se userId vier, usa; caso contrário deixa o Prisma gerar (cuid)
    const createData: any = { baseAccountAddress: base, subAccountAddress: sub };
    if (userId) createData.id = userId;

    // upsert pelo baseAccountAddress (unique no schema)
    const user = await prisma.user.upsert({
      where: { baseAccountAddress: base },
      update: { subAccountAddress: sub },
      create: createData,
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    // conflito por subAccountAddress (unique)
    if (e?.code === "P2002" && Array.isArray(e?.meta?.target) && e.meta.target.includes("subAccountAddress")) {
      return NextResponse.json({ error: "sub_account_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message ?? "internal_error" }, { status: 500 });
  }
}