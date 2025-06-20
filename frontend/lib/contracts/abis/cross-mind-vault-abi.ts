/**
 * ABI for the CrossMindVault contract
 * Based on the contract at /contracts/contracts/CrossMindVault.sol
 */
export const crossMindVaultABI = [
  // Read functions
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getBalance",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bool", name: "locked", type: "bool" }
        ],
        internalType: "struct CrossMindVault.Balance",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  
  // Write functions
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "withdrawRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
