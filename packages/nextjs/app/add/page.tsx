"use client";

import React, { useState } from "react";

// Definição do estado inicial do formulário (mantida igual)
interface FormData {
  channelName: string;
  walletAddress: string;
}

export default function Page() {
  const [formData, setFormData] = useState<FormData>({
    channelName: "",
    walletAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.channelName || !formData.walletAddress) {
      setMessage("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Simulação de chamada API
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage(`Canal "${formData.channelName}" adicionado com sucesso!`);
      setFormData({ channelName: "", walletAddress: "" });
    } catch (error) {
      console.error("Erro ao adicionar canal:", error);
      setMessage("Falha ao adicionar canal. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contêiner principal, centralizado (mantém o layout vertical da página)
    // Fundo da página: Branco (bg-base-100)
    <div className="flex justify-center w-full pt-8 pb-8 bg-base-100">
      <div className="w-[90%] max-w-8xl p-6 rounded-xl shadow-2xl bg-gray-100 border border-gray-300">
        <h1 className="text-2xl font-bold text-primary mb-6">Adicionar Novo Canal</h1>

        {/* Mensagem de Feedback */}
        {message && (
          <div
            className={`p-3 mb-4 rounded ${message.includes("sucesso") ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ---------------------------------------------------- */}
          {/* CAMPOS EM LAYOUT HORIZONTAL (DEITADO) */}
          {/* ---------------------------------------------------- */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Campo Nome do Canal */}
            <div className="flex-1">
              {" "}
              {/* flex-1 garante que ocupa o espaço horizontal */}
              <label htmlFor="channelName" className="block text-sm font-medium text-base-content mb-1">
                Nome do Canal
              </label>
              <input
                type="text"
                id="channelName"
                name="channelName"
                value={formData.channelName}
                onChange={handleChange}
                required
                placeholder="Ex: MeuCanalDeStreaming"
                // Usando o estilo de input simples
                className="input input-bordered w-full bg-white text-base-content"
                disabled={loading}
              />
            </div>

            {/* Campo Endereço da Carteira */}
            <div className="flex-1">
              {" "}
              {/* flex-1 garante que ocupa o espaço horizontal */}
              <label htmlFor="walletAddress" className="block text-sm font-medium text-base-content mb-1">
                Endereço da Carteira (0x...)
              </label>
              <input
                type="text"
                id="walletAddress"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                required
                placeholder="0x..."
                className="input input-bordered w-full bg-white text-base-content"
                disabled={loading}
              />
            </div>
          </div>
          {/* ---------------------------------------------------- */}

          {/* Botão de Submissão (Ocupa a largura total abaixo dos inputs) */}
          <button
            type="submit"
            className="btn btn-primary w-full text-primary-content hover:bg-secondary transition duration-150"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>A adicionar...
              </>
            ) : (
              "Adicionar Canal"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
