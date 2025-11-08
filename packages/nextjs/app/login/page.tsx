"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignInWithBaseButton } from "@base-org/account-ui/react";
import { createWalletClient, custom } from "viem";
import { baseSepolia } from "viem/chains";

function LoginPageContent() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // useSearchParams precisa estar dentro de um suspense boundary
  const params = useSearchParams();
  const extId = useMemo(() => params.get("ext") || "", [params]);
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN!;

  const signIn = async () => {
    if (loading) return;
    setLoading(true);
    setErr(null);
    try {
      const { createBaseAccountSDK } = await import("@base-org/account");
      const sdk = createBaseAccountSDK({
        appName: "ETHSamba Demo",
        appLogoUrl: "https://base.org/logo.png",
        appChainIds: [baseSepolia.id],
      });

      // 1) conecta Base Account
      const provider = sdk.getProvider();
      await provider.request({ method: "wallet_connect" });

      // 2) recupera endereço
      const wallet = createWalletClient({ chain: baseSepolia, transport: custom(provider) });
      const [addr] = await wallet.getAddresses();
      if (!addr) throw new Error("Sem endereço.");

      // 3) pega nonce
      const nonceRes = await fetch("/api/auth/nonce", { method: "GET", cache: "no-store", credentials: "include" });
      if (!nonceRes.ok) throw new Error("Falha ao obter nonce");
      const { nonce } = await nonceRes.json();

      // 4) monta mensagem SIWE-like
      const statement = "Sign in with Base (ETHSamba Demo)";
      const msg = [
        `${location.host} wants you to sign in with your Ethereum account:`,
        `${addr}`,
        ``,
        `${statement}`,
        `URI: ${siteOrigin}`,
        `Version: 1`,
        `Chain ID: ${baseSepolia.id}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      // 5) assina
      const signature = await provider.request({ method: "personal_sign", params: [msg, addr] });

      // 6) verifica assinatura
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address: addr, message: msg, signature, nonce }),
      });

      const payload = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok) {
        throw new Error(
          `Falha na verificação: ${payload?.error || verifyRes.status}${payload?.detail ? ` — ${payload.detail}` : ""}`,
        );
      }

      const { token } = payload;

      // 7) envia token para a extensão (se houver extId)
      if (extId) {
        // @ts-ignore
        chrome.runtime?.sendMessage?.(extId, { type: "BASE_LOGIN_DONE", address: addr, token }, () => {
          window.close?.();
        });
      }
    } catch (e: any) {
      setErr(e?.message ?? "Erro no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 560 }}>
      <h1>Login com Base</h1>
      <p>Confirme a posse da sua conta assinando uma mensagem.</p>
      <div style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}>
        <SignInWithBaseButton colorScheme="light" onClick={signIn} />
      </div>
      {err && <p style={{ color: "crimson", marginTop: 12, whiteSpace: "pre-wrap" }}>{err}</p>}
    </main>
  );
}

// Componente exportado: envolve o filho em <Suspense>
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
