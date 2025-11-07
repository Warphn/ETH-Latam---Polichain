"use client";

import React, { useState, useEffect } from "react";
import { SignInWithBaseButton } from "@base-org/account-ui/react";
import { createPublicClient, createWalletClient, custom, formatEther, http, PublicClient, HttpTransport, Address } from "viem";
import { baseSepolia } from "viem/chains";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline"; // Ícone de Logout

// Cliente público (mantido)
const publicClient: PublicClient<HttpTransport, typeof baseSepolia> = createPublicClient({
    chain: baseSepolia,
    transport: http("/api/rpc"),
});

export const ConnectBaseButton = () => {
    // ESTADOS
    const [universalAddress, setUniversalAddress] = useState<Address | null>(null);
    const [subAddress, setSubAddress] = useState<Address | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [subBalance, setSubBalance] = useState<bigint | null>(null);
    const [balLoading, setBalLoading] = useState(false);

    // ✅ NOVO: Função para Deslogar
    const handleLogout = () => {
        setUniversalAddress(null);
        setSubAddress(null);
        setSubBalance(null);
        setErr(null);
        // Opcional: Se você estiver a usar localStorage para persistir o estado de login, limpe-o aqui.
        console.log("Usuário deslogado.");
    };

    // FUNÇÃO DE CONEXÃO (mantida)
    const connectAndEnsureSubAccount = async () => {
        if (loading) return;
        setLoading(true);
        setErr(null);
        try {
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
            const [account] = await wallet.getAddresses();
            if (!account) throw new Error("Nenhuma conta retornada.");
            const userAddr = account as Address;
            setUniversalAddress(userAddr);

            let sub = await sdk.subAccount.get();
            if (!sub) {
                const createParam = { 
                    type: "create" as const, 
                    keys: [{ type: "address" as const, publicKey: userAddr }],
                };
                sub = await sdk.subAccount.create(createParam as any); 
            }
            
            setSubAddress(sub.address as Address);
        } catch (e: any) {
            setErr(e?.message ?? "Falha na conexão");
        } finally {
            setLoading(false);
        }
    };

    // LÓGICA DE SALDO (mantida)
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

    // 1. Estado de Carregamento
    if (loading) {
        return (
            <button className="btn btn-sm bg-primary text-primary-content" disabled>
                <span className="loading loading-spinner"></span>
                Conectando...
            </button>
        );
    }

    if (universalAddress) {
        const balanceText = balLoading ? 'carregando...' : subBalance !== null ? `${Number(formatEther(subBalance)).toFixed(3)} ETH` : '—';
        
        return (
            <div className="flex items-center gap-4 text-primary-content text-sm">
                
                {subAddress && (
                    <div className="flex flex-col items-end">
                        <span className="opacity-70 text-xs">Sub Account:</span>
                        <span className="font-mono text-sm leading-tight" title={subAddress || ''}>
                            {subAddress.substring(0, 6)}...{subAddress.substring(subAddress.length - 4)}
                        </span>
                    </div>
                )}
                <div className="flex flex-col items-end">
                    <span className="opacity-70 text-xs">Saldo:</span>
                    <span className="font-mono text-sm leading-tight">{balanceText}</span>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="btn btn-ghost btn-circle text-primary-content/80 hover:text-white"
                    title="Deslogar"
                >
                    <ArrowLeftStartOnRectangleIcon className="h-6 w-6" />
                </button>
            </div>
        );
    }

    return (
        <div className="inline-block">
           <button
                    onClick={connectAndEnsureSubAccount}
                    className="btn btn-sm btn-primary text-primary-content hover:bg-secondary border-none" 
                >
                    {/* Você pode manter o texto original ou customizar */}
                    Conectar Carteira
                </button>
                
                {err && <span className="text-error text-xs ml-2">Erro</span>}
        </div>
    );
};