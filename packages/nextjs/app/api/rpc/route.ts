// app/api/rpc/route.ts
export const runtime = "nodejs"; // força Node (evita Edge sem fetch outbound)

const ALCHEMY_URL = process.env.ALCHEMY_BASE_SEPOLIA_RPC;

function assertEnv() {
  if (!ALCHEMY_URL) {
    throw new Error("ALCHEMY_BASE_SEPOLIA_RPC não definido. Configure em .env.local e reinicie o servidor.");
  }
}

export async function POST(req: Request) {
  try {
    assertEnv();

    // Pass-through total do JSON-RPC
    const body = await req.text();

    const upstream = await fetch(ALCHEMY_URL as string, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
    });

    const text = await upstream.text();

    // Propaga status/erro do provedor
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    // Resposta JSON-RPC compatível em caso de falha no proxy
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: err?.message ?? "Falha ao encaminhar requisição para o provedor RPC (proxy).",
        },
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

// (opcional) GET de health-check
export async function GET() {
  try {
    assertEnv();
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? "Env ausente" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
