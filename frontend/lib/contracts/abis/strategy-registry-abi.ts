/**
 * ABI for the Strategy Registry contract
 * This is a placeholder - replace with your actual contract ABI
 */
export const strategyRegistryABI = [
  // Read functions
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "getStrategiesByOwner",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" }
        ],
        internalType: "struct StrategyRegistry.Strategy[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "strategyId", type: "uint256" }],
    name: "getStrategyById",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" }
        ],
        internalType: "struct StrategyRegistry.Strategy",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  
  // Write functions
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "description", type: "string" }
    ],
    name: "createStrategy",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "strategyId", type: "uint256" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "description", type: "string" }
    ],
    name: "updateStrategy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "strategyId", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" }
    ],
    name: "setStrategyActive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
