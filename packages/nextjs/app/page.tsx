"use client";

import { useEffect, useState } from "react";
import { SignInWithBaseButton } from "@base-org/account-ui/react";
import { createPublicClient, createWalletClient, custom, formatEther, http } from "viem";
import { baseSepolia } from "viem/chains";

// Todas as leituras onchain via proxy (evita CORS e esconde a API key)
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("/api/rpc"),
});

export default function Page() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [balance, setBalance] = useState<bigint | null>(null);
  const [balLoading, setBalLoading] = useState(false);

  const signInWithBase = async () => {
    if (loading) return;
    setLoading(true);
    setErr(null);
    try {
      // Importa o SDK apenas no client e apenas quando necessário
      const { createBaseAccountSDK } = await import("@base-org/account");
      const sdk = createBaseAccountSDK({
        appName: "ETHSamba Demo",
        appChainIds: [baseSepolia.id],
      });

      // 1) Abre o fluxo de conexão do Base Account
      const provider = sdk.getProvider();
      // método padrão documentado para abrir o modal
      await provider.request({ method: "wallet_connect" });

      // 2) Cria um WalletClient do viem sobre o provider EIP-1193
      const wallet = createWalletClient({
        chain: baseSepolia,
        transport: custom(provider),
      });

      // 3) Obtém o(s) endereço(s) conectado(s)
      const [account] = await wallet.getAddresses();
      if (!account) throw new Error("Nenhuma conta retornada pelo provider.");
      setAddress(account as `0x${string}`);
    } catch (e: any) {
      setErr(e?.message ?? "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  // Busca saldo quando houver address (com polling leve)
  useEffect(() => {
    if (!address) return;
    let stop = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchBalance = async () => {
      try {
        setBalLoading(true);
        const bal = await publicClient.getBalance({ address });
        if (!stop) setBalance(bal);
      } catch (e: any) {
        // Mostra o erro de saldo na UI para depurar se necessário
        console.error("Erro ao obter saldo:", e);
      } finally {
        if (!stop) setBalLoading(false);
      }
    };

    fetchBalance();
    timer = setInterval(fetchBalance, 15_000);

    return () => {
      stop = true;
      if (timer) clearInterval(timer);
    };
  }, [address]);

  return (
    <main style={{ padding: 24, maxWidth: 680 }}>
      <h1>Login</h1>

      <div
        aria-busy={loading}
        style={{
          display: "inline-block",
          opacity: loading ? 0.6 : 1,
          pointerEvents: loading ? "none" : "auto",
        }}
      >
        <SignInWithBaseButton colorScheme="light" onClick={signInWithBase} />
      </div>

      {address && (
        <section style={{ marginTop: 16 }}>
          <p>
            Conectado: <code>{address}</code>
          </p>
          <p>
            Saldo (ETH, Base Sepolia):{" "}
            {balLoading && balance === null
              ? "carregando..."
              : balance !== null
                ? `${Number(formatEther(balance)).toFixed(6)} ETH`
                : "—"}
          </p>
        </section>
      )}

      {err && <p style={{ marginTop: 16, color: "crimson" }}>{err}</p>}
    </main>
  );
}
