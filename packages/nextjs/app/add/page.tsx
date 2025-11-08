"use client";

import React, { useState } from "react";
import { useWallet } from "~~/components/wallet/walletprovider";

export default function YoutubeVerifyPage() {
  const { isAuthed, connect, universalAddress, subAddress } = useWallet();
  const [channelInput, setChannelInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [intendedChannelId, setIntendedChannelId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canAct = isAuthed && universalAddress;
  const headers = {
    "Content-Type": "application/json",
    "x-base-address": universalAddress ?? "",
    "x-sub-address": subAddress ?? "",
  };

  const start = async () => {
    setMsg(null);
    if (!canAct) return setMsg("Conecte sua carteira para continuar.");
    const res = await fetch("/api/youtube/verify/start", {
      method: "POST",
      headers,
      body: JSON.stringify({ channel: channelInput || undefined }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error || "Falha ao gerar código");
    setCode(data.code);
    setIntendedChannelId(data.intendedChannelId);
    setMsg("Código gerado! Cole na descrição do canal e clique em 'Verificar agora'.");
  };

  const check = async () => {
    if (!code) return;
    if (!canAct) return setMsg("Conecte sua carteira para continuar.");
    setChecking(true);
    setMsg(null);
    try {
      const res = await fetch("/api/youtube/verify/check", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code,
          channel: channelInput || intendedChannelId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(data?.hint || data?.error || "Não encontrei o código. Tente novamente.");
      } else {
        setMsg(`Verificado: ${data.channelTitle || data.channelId}`);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Verificar canal do YouTube (gratuito)</h1>

      {!isAuthed ? (
        <button className="btn btn-primary" onClick={connect}>
          Conectar carteira
        </button>
      ) : (
        <div className="text-sm opacity-80">
          Conectado: <code className="break-all">{universalAddress}</code>
        </div>
      )}

      <label className="block text-sm font-medium">Canal (URL, @handle ou ID UC...)</label>
      <input
        className="input input-bordered w-full bg-white"
        value={channelInput}
        onChange={e => setChannelInput(e.target.value)}
        placeholder="https://youtube.com/@seucanal  ou  UC_xxx..."
        disabled={!canAct}
      />

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={start} disabled={!canAct}>
          Gerar código
        </button>
        <button className="btn" onClick={check} disabled={!canAct || !code || checking}>
          {checking ? <span className="loading loading-spinner" /> : "Verificar agora"}
        </button>
      </div>

      {code && (
        <div className="alert bg-base-200">
          Cole <b>{code}</b> na descrição do canal (About), salve e então clique em “Verificar agora”.
        </div>
      )}

      {msg && <div className="text-sm opacity-80">{msg}</div>}
    </div>
  );
}
