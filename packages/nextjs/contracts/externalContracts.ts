import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * External contracts configuration.
 *
 * Replace `1` (mainnet) with the chainId where your contract is deployed
 * Example: 11155111 = Sepolia, 8453 = Base, 137 = Polygon
 */
const externalContracts = {
  1: {
    TransferWithFee: {
      address: "0x29f9B8425290978dAf891D341162AEeb1D1cFC97", // ⬅️ seu endereço de contrato
      abi: [
        {
          inputs: [{ internalType: "uint256", name: "_feePercent", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "newBalance", type: "uint256" },
          ],
          name: "Deposit",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            { indexed: false, internalType: "uint256", name: "oldFee", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "newFee", type: "uint256" },
          ],
          name: "FeeUpdated",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
          ],
          name: "FeeWithdrawn",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "address", name: "fromUser", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: false, internalType: "uint256", name: "amountSent", type: "uint256" },
            { indexed: false, internalType: "uint256", name: "feeTaken", type: "uint256" },
          ],
          name: "TransferExecuted",
          type: "event",
        },
        {
          inputs: [],
          name: "contractBalance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "deposit",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [],
          name: "feePercent",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            { internalType: "address", name: "fromUser", type: "address" },
            { internalType: "address payable", name: "to", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
          ],
          name: "sendFromUser",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [{ internalType: "uint256", name: "_newFeePercent", type: "uint256" }],
          name: "updateFee",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [{ internalType: "address", name: "userAddr", type: "address" }],
          name: "userBalance",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [{ internalType: "address", name: "", type: "address" }],
          name: "users",
          outputs: [
            { internalType: "uint256", name: "balance", type: "uint256" },
            { internalType: "uint256", name: "spent", type: "uint256" },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "withdrawFees",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          stateMutability: "payable",
          type: "receive",
        },
      ],
    },
  },
} as const satisfies GenericContractsDeclaration;

export default externalContracts;
