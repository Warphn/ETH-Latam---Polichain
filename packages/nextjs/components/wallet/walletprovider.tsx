"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { Address } from "viem";
import { baseSepolia } from "viem/chains";
import { createPublicClient, http } from "viem";
import { useQuery } from "@tanstack/react-query";

type WalletContextValue = {
  universalAddress: Address | null;
  subAddress: Address | null;
  isConnecting: boolean;
  error: string | null;

  // auth
  isAuthed: boolean;
  authToken: string | null;

  // ações
  connect: () => Promise<void>;
  logout: () => Promise<void>;

  // dados derivados
  subBalanceWei: bigint | null;
  isFetchingBalance: boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("/api/rpc"),
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [universalAddress, setUniversalAddress] = useState<Address | null>(null);
  const [subAddress, setSubAddress] = useState<Address | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // auth
  const [isAuthed, setIsAuthed] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const { data: subBalanceWei, isFetching: isFetchingBalance } = useQuery({
    queryKey: ["subBalance", subAddress],
    queryFn: async () => {
      if (!subAddress) return null;
      return await publicClient.getBalance({ address: subAddress });
    },
    enabled: !!subAddress,
    refetchInterval: 15_000,
  });

  // --- helper: vincula subaccount no backend (estável) ---
  const linkSubaccountOnBackend = useCallback(async (params: {
    base: Address;
    sub: Address;
    userId?: string;
  }) => {
    try {
      const res = await fetch("/api/user/link-subaccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseAccountAddress: params.base,
          subAccountAddress: params.sub,
          // userId: params.userId,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        console.warn("[link-subaccount] falha:", res.status, payload);
      } else {
        const payload = await res.json().catch(() => null);
        console.log("[link-subaccount] ok:", payload);
      }
    } catch (e) {
      console.warn("[link-subaccount] erro:", e);
    }
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      const { createWalletClient, custom } = await import("viem");
      const BaseAccountSDK = await import("@base-org/account");
      const { createBaseAccountSDK } = BaseAccountSDK;

      const sdk = createBaseAccountSDK({
        appName: "ETHSamba Demo",
        appLogoUrl: "https://base.org/logo.png",
        appChainIds: [baseSepolia.id],
      });

      const provider = sdk.getProvider();
      await provider.request({ method: "wallet_connect" });

      const wallet = createWalletClient({ chain: baseSepolia, transport: custom(provider) });
      const [addr] = await wallet.getAddresses();
      if (!addr) throw new Error("Sem endereço.");
      const address = addr as Address;

      const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? location.origin;
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      if (!nonceRes.ok) throw new Error("Falha ao obter nonce");
      const { nonce } = await nonceRes.json();

      const statement = "Sign in with Base (ETHSamba Demo)";
      const msg = [
        `${location.host} wants you to sign in with your Ethereum account:`,
        `${address}`,
        ``,
        `${statement}`,
        `URI: ${siteOrigin}`,
        `Version: 1`,
        `Chain ID: ${baseSepolia.id}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      const signature = await provider.request({
        method: "personal_sign",
        params: [msg, address],
      });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address, message: msg, signature, nonce }),
      });

      const payload = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok) {
        throw new Error(
          `Falha na verificação: ${payload?.error || verifyRes.status}${
            payload?.detail ? ` — ${payload.detail}` : ""
          }`,
        );
      }

      const token: string | undefined = payload?.token;
      if (token) setAuthToken(token);

      setIsAuthed(true);
      setUniversalAddress(address);

      let sub = await sdk.subAccount.get();
      if (!sub) {
        const createParam = {
          type: "create" as const,
          keys: [{ type: "address" as const, publicKey: address }],
        };
        sub = await sdk.subAccount.create(createParam as any);
      }
      const subAddr = sub.address as Address;
      setSubAddress(subAddr);

      void linkSubaccountOnBackend({ base: address, sub: subAddr });
    } catch (e: any) {
      setError(e?.message ?? "Falha na conexão/autenticação");
      setIsAuthed(false);
      setAuthToken(null);
      setUniversalAddress(null);
      setSubAddress(null);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, linkSubaccountOnBackend]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    } finally {
      setIsAuthed(false);
      setAuthToken(null);
      setUniversalAddress(null);
      setSubAddress(null);
      setError(null);
    }
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      universalAddress,
      subAddress,
      isConnecting,
      error,
      isAuthed,
      authToken,
      connect,
      logout,
      subBalanceWei: subBalanceWei ?? null,
      isFetchingBalance,
    }),
    [
      universalAddress,
      subAddress,
      isConnecting,
      error,
      isAuthed,
      authToken,
      subBalanceWei,
      isFetchingBalance,
      connect,   // ✅ agora incluídos
      logout,    // ✅
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet deve ser usado dentro de <WalletProvider />");
  return ctx;
}