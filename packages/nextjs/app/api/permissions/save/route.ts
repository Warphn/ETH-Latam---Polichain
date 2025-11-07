// src/app/api/permissions/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, permission } = await req.json();

  // valide campos mínimos
  const {
    permissionHash,
    account, // owner (subaccount)
    spender,
    token,
    allowance,
    period, // segundos
    start,
    end,
    salt,
    extraData,
    signature,
    chainId,
  } = permission ?? {};

  if (!userId || !permissionHash || !account || !spender || chainId == null) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // garanta que o usuário existe
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  // upsert da permissão
  const saved = await prisma.spendPermission.upsert({
    where: { permissionHash },
    update: {
      userId,
      ownerAccount: account,
      spender,
      token,
      allowance,
      periodSeconds: period,
      startTs: BigInt(start ?? 0),
      endTs: BigInt(end ?? 0),
      salt: String(salt ?? ""),
      extraData: extraData ? Buffer.from(extraData.slice(2), "hex") : null,
      signature: signature ? Buffer.from(signature.slice(2), "hex") : Buffer.alloc(0),
      chainId,
      revokedAt: null,
    },
    create: {
      permissionHash,
      userId,
      ownerAccount: account,
      spender,
      token,
      allowance,
      periodSeconds: period,
      startTs: BigInt(start ?? 0),
      endTs: BigInt(end ?? 0),
      salt: String(salt ?? ""),
      extraData: extraData ? Buffer.from(extraData.slice(2), "hex") : null,
      signature: signature ? Buffer.from(signature.slice(2), "hex") : Buffer.alloc(0),
      chainId,
    },
  });

  return NextResponse.json({ ok: true, permissionHash: saved.permissionHash });
}
