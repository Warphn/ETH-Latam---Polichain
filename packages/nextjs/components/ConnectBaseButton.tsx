// components/ConnectBaseButton.tsx


"use client";

import { formatEther } from "viem";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { useWallet } from "./wallet/walletprovider";


export const ConnectBaseButton = () => {
  const {
    universalAddress,
    subAddress,
    isConnecting,
    error,
    connect,
    logout,
    subBalanceWei,
    isFetchingBalance,
  } = useWallet();

  if (isConnecting) {
    return (
      <button className="btn btn-sm bg-primary text-primary-content" disabled>
        <span className="loading loading-spinner"></span>
        Conectando...
      </button>
    );
  }

  if (universalAddress) {
    const balanceText =
      isFetchingBalance
        ? "carregando..."
        : subBalanceWei !== null
        ? `${Number(formatEther(subBalanceWei)).toFixed(3)} ETH`
        : "—";

    return (
      <div className="flex items-center gap-4 text-primary-content text-sm">
        {subAddress && (
          <div className="flex flex-col items-end">
            <span className="opacity-70 text-xs">Sub Account:</span>
            <span className="font-mono text-sm leading-tight" title={subAddress}>
              {subAddress.substring(0, 6)}...{subAddress.substring(subAddress.length - 4)}
            </span>
          </div>
        )}
        <div className="flex flex-col items-end">
          <span className="opacity-70 text-xs">Saldo:</span>
          <span className="font-mono text-sm leading-tight">{balanceText}</span>
        </div>

        <button
          onClick={logout}
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
        onClick={connect}
        className="btn btn-sm btn-primary text-primary-content hover:bg-secondary border-none"
      >
        Conectar Carteira
      </button>
      {error && <span className="text-error text-xs ml-2">Erro</span>}
    </div>
  );
};