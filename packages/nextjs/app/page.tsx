"use client";

import { useEffect, useState } from "react";
import { Profile } from "../components/Profile";
import { SignInWithBaseButton } from "@base-org/account-ui/react";
import { createPublicClient, createWalletClient, custom, formatEther, http } from "viem";
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("/api/rpc"), // proxy -> Alchemy
});

export default function Page() {
  const [universalAddress, setUniversalAddress] = useState<`0x${string}` | null>(null);
  const [subAddress, setSubAddress] = useState<`0x${string}` | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [subBalance, setSubBalance] = useState<bigint | null>(null);
  const [balLoading, setBalLoading] = useState(false);

  const connectAndEnsureSubAccount = async () => {
    if (loading) return;
    setLoading(true);
    setErr(null);
    try {
      // 1) SDK só no client
      const { createBaseAccountSDK } = await import("@base-org/account");
      const sdk = createBaseAccountSDK({
        appName: "ETHSamba Demo",
        appLogoUrl: "https://base.org/logo.png",
        appChainIds: [baseSepolia.id],
      });

      // 2) Conectar Base Account
      const provider = sdk.getProvider();
      await provider.request({ method: "wallet_connect" });

      // 3) Endereço universal (conta principal do usuário)
      const wallet = createWalletClient({
        chain: baseSepolia,
        transport: custom(provider),
      });
      const [account] = await wallet.getAddresses();
      if (!account) throw new Error("Nenhuma conta retornada pelo provider.");
      const userAddr = account as `0x${string}`;
      setUniversalAddress(userAddr);

      // 4) Ver se já existe Sub Account para este domínio/app
      let sub = await sdk.subAccount.get();

      // 5) Se não existir, cria com o formato exigido pela sua versão (AccountCreate)
      if (!sub) {
        const createParam = {
          type: "create" as const,
          keys: [
            {
              type: "address" as const,
              // usa o endereço universal como "publicKey" do tipo address
              publicKey: userAddr,
            },
            // Alternativas (se quiser usar P-256 no futuro):
            // { type: 'webcrypto-p256' as const, publicKey: '0x...' },
            // { type: 'p256' as const, publicKey: '0x...' },
          ],
        };
        sub = await sdk.subAccount.create(createParam);
      }

      setSubAddress(sub.address as `0x${string}`);
    } catch (e: any) {
      setErr(e?.message ?? "Falha ao autenticar/criar subaccount");
    } finally {
      setLoading(false);
    }
  };

  // saldo da Sub Account
  useEffect(() => {
    if (!subAddress) return;
    let stop = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchBalance = async () => {
      try {
        setBalLoading(true);
        const bal = await publicClient.getBalance({ address: subAddress });
        if (!stop) setSubBalance(bal);
      } catch {
        // opcional: console.error('Erro saldo subaccount:', e);
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
  }, [subAddress]);

  return (
    <main style={{ padding: 24, maxWidth: 760 }}>
      <h1>Login + Sub Accounts (Base Sepolia)</h1>

      <div
        aria-busy={loading}
        style={{
          display: "inline-block",
          opacity: loading ? 0.6 : 1,
          pointerEvents: loading ? "none" : "auto",
        }}
      >
        <SignInWithBaseButton colorScheme="light" onClick={connectAndEnsureSubAccount} />
      </div>

      {universalAddress && (
        <section style={{ marginTop: 16 }}>
          <p>
            Universal Account: <code>{universalAddress}</code>
          </p>
        </section>
      )}

      {subAddress && (
        <section style={{ marginTop: 8 }}>
          <p>
            Sub Account: <code>{subAddress}</code>
          </p>
          <p>
            Saldo da Sub (ETH, Base Sepolia):{" "}
            {balLoading && subBalance === null
              ? "carregando..."
              : subBalance !== null
                ? `${Number(formatEther(subBalance)).toFixed(6)} ETH`
                : "—"}
          </p>
        </section>
      )}
      <Profile />
      {err && <p style={{ marginTop: 16, color: "crimson" }}>{err}</p>}
    </main>
  );
}
