import { parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

/**
 * Hook principal para o contrato TransferWithFee.
 * Permite ler o saldo total, depositar, enviar fundos e atualizar a taxa.
 */
export const useTransferWithFee = () => {
  // 💰 Ler o saldo total do contrato
  const { data: contractBalance, refetch: refetchContractBalance } = useScaffoldReadContract({
    contractName: "TransferWithFee",
    functionName: "contractBalance",
  });

  // ✍️ Instância de escrita
  const { writeContractAsync: write } = useScaffoldWriteContract("TransferWithFee");

  // 💵 Fazer depósito
  const deposit = async (amountEth: string) => {
    if (!amountEth) throw new Error("Informe o valor em ETH");
    return write({
      functionName: "deposit",
      value: parseEther(amountEth),
    });
  };

  // 🧾 Owner envia fundos em nome de um usuário
  const sendFromUser = async (from: string, to: string, amountEth: string) => {
    if (!from || !to || !amountEth) throw new Error("Parâmetros inválidos");
    return write({
      functionName: "sendFromUser",
      args: [from, to, parseEther(amountEth)],
    });
  };

  // ⚙️ Atualizar taxa
  const updateFee = async (newFeePercent: number) => {
    return write({
      functionName: "updateFee",
      args: [BigInt(newFeePercent)],
    });
  };

  // 💸 Sacar taxas acumuladas
  const withdrawFees = async () => {
    return write({
      functionName: "withdrawFees",
    });
  };

  return {
    contractBalance,
    refetchContractBalance,
    deposit,
    sendFromUser,
    updateFee,
    withdrawFees,
  };
};
