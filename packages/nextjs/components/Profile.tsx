"use client";

import React, { useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

// ------------------------------------
// 1. Definição da Estrutura de Dados
// ------------------------------------
interface TipReceiver {
  id: number;
  channelName: string; // O nome do "Canal"
  walletAddress: string; // O endereço da "Carteira"
}

// ------------------------------------
// Função para Simular a Chamada à Base de Dados (API)
// ------------------------------------
const fetchReceivers = async (): Promise<TipReceiver[]> => {
  // Substitua este código pela sua chamada real à API para buscar os canais/carteiras
  await new Promise(resolve => setTimeout(resolve, 500)); // Simula latência

  return [
    {
      id: 1,
      channelName: "LiveStreamerXYZ",
      walletAddress: "0xAbc123...Def456", // Endereço de exemplo
    },
    {
      id: 2,
      channelName: "GamingChannel",
      walletAddress: "0x789Ghi...Jkl012",
    },
    {
      id: 3,
      channelName: "CozinhaDaMaria",
      walletAddress: "0xMno345...Pqr678",
    },
    {
      id: 4,
      channelName: "DevTipsBrasil",
      walletAddress: "0xStu901...Vwx234",
    },
    {
      id: 5,
      channelName: "MusicaLovers",
      walletAddress: "0xYzA567...Bcd890",
    },
    // Adicione mais itens aqui para simular a "rolagem infinita"
    { id: 6, channelName: "OutroCanal1", walletAddress: "0x1111...1111" },
    { id: 7, channelName: "OutroCanal2", walletAddress: "0x2222...2222" },
    { id: 8, channelName: "OutroCanal3", walletAddress: "0x3333...3333" },
    { id: 9, channelName: "OutroCanal4", walletAddress: "0x4444...4444" },
    { id: 10, channelName: "OutroCanal5", walletAddress: "0x5555...5555" },
  ];
};

// ------------------------------------
// Componente principal
// ------------------------------------
export const Profile = () => {
  const [receivers, setReceivers] = useState<TipReceiver[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para lidar com a exclusão de um item
  const handleDelete = (id: number, channel: string) => {
    // ⚠️ ATENÇÃO: Aqui você colocaria a chamada API para EXCLUIR do banco de dados
    console.log(`Solicitação de exclusão para o ID: ${id} (${channel})`);

    // Atualiza o estado para remover o item localmente
    setReceivers(prevReceivers => prevReceivers.filter(receiver => receiver.id !== id));
  };

  // Efeito para carregar os dados
  useEffect(() => {
    const loadReceivers = async () => {
      try {
        setLoading(true);
        const data = await fetchReceivers();
        setReceivers(data);
      } catch (error) {
        console.error("Erro ao carregar recebedores:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReceivers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-600">A carregar canais...</p>
      </div>
    );
  }

  // ------------------------------------
  // Renderização da Lista de Cards
  // ------------------------------------
  return (
    // Contêiner principal: Ocupa a largura total (w-full), centraliza, e usa min-h-screen
    // O pt-24 (padding top) é adicionado para garantir que não seja coberto por um header fixo comum (que tem cerca de 64px, ou p-16)
    <div className="flex justify-center w-full min-h-screen pt-10 pb-8">
      {/* NOVO CONTÊINER: w-[90%] é mantido. */}
      <div className="w-[90%]">
        {/* Contêiner da lista: REMOÇÃO DA BORDA e da altura fixa (h-[500px]) */}
        <div className="overflow-y-auto space-y-3 p-2 rounded-lg shadow-inner bg-gray-50">
          {receivers.length === 0 ? (
            <p className="text-center text-gray-500 py-10">Nenhum canal registrado.</p>
          ) : (
            receivers.map(receiver => (
              // Card Individual
              <div
                key={receiver.id}
                // O Card original também tinha uma borda (border border-gray-200), que removemos aqui.
                className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between transition duration-150 hover:bg-gray-100"
              >
                {/* Informações do Canal e Carteira */}
                <div className="flex flex-col flex-grow">
                  <span className="text-xs font-semibold uppercase text-primary">Canal</span>
                  <p className="text-lg font-bold text-gray-800 mb-2">{receiver.channelName}</p>

                  <span className="text-xs font-semibold uppercase text-gray-500">Carteira</span>
                  <p className="text-sm text-gray-600 font-mono">
                    {receiver.walletAddress.substring(0, 8)}...
                    {receiver.walletAddress.substring(receiver.walletAddress.length - 4)}
                  </p>
                </div>

                {/* Botão de Excluir */}
                <button
                  onClick={() => handleDelete(receiver.id, receiver.channelName)}
                  className="ml-4 p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none transition duration-150"
                  title={`Excluir ${receiver.channelName}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
