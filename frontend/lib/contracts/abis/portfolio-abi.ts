/**
 * ABI for the Portfolio contract
 * This is a placeholder - replace with your actual contract ABI
 */
export const portfolioABI = [
  // Read functions
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "getPortfolio",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "totalValue", type: "uint256" },
          { internalType: "uint256", name: "lastUpdated", type: "uint256" },
          {
            components: [
              { internalType: "address", name: "tokenAddress", type: "address" },
              { internalType: "string", name: "symbol", type: "string" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              { internalType: "uint256", name: "value", type: "uint256" }
            ],
            internalType: "struct Portfolio.Asset[]",
            name: "assets",
            type: "tuple[]"
          }
        ],
        internalType: "struct Portfolio.PortfolioData",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "tokenAddress", type: "address" }
    ],
    name: "getAssetBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "getPortfolioPerformance",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "value", type: "uint256" }
        ],
        internalType: "struct Portfolio.PerformanceData[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  
  // Write functions
  {
    inputs: [],
    name: "syncPortfolio",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "tokenAddress", type: "address" }],
    name: "addAssetToTracking",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "tokenAddress", type: "address" }],
    name: "removeAssetFromTracking",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
