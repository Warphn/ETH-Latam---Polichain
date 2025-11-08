import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/**
 * Hook para ler o saldo de um usuário no contrato TransferWithFee.
 *
 * Corrige o erro de tipo do args com tupla readonly.
 */
export const useUserBalance = (userAddress?: string) => {
  return useScaffoldReadContract({
    contractName: "TransferWithFee",
    functionName: "userBalance",
    // sempre envia uma tupla — mesmo que o valor interno seja undefined
    args: [userAddress] as const,
  });
};
