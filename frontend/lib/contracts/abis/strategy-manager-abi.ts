/**
 * ABI for the StrategyManager contract
 * Based on the contract at /contracts/contracts/StrategyManager.sol
 */
export const strategyManagerABI = [
  // Read functions
  {
    inputs: [],
    name: "getSupportedChainIds",
    outputs: [{ internalType: "uint64[]", name: "", type: "uint64[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint64", name: "chainId", type: "uint64" }],
    name: "getProtocols",
    outputs: [
      {
        components: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "address", name: "adapter", type: "address" }
        ],
        internalType: "struct StrategyManager.Protocol[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  
  // Write functions
  {
    inputs: [
      {
        components: [
          { internalType: "uint64", name: "chainId", type: "uint64" },
          {
            components: [
              { internalType: "address", name: "adapter", type: "address" },
              { internalType: "uint256", name: "percentage", type: "uint256" }
            ],
            internalType: "struct StrategyManager.Deposit[]",
            name: "deposits",
            type: "tuple[]"
          }
        ],
        internalType: "struct StrategyManager.Strategy[]",
        name: "strategy",
        type: "tuple[]"
      }
    ],
    name: "executeStrategy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
