/**
 * CrossMind Contract ABIs
 * Centralized location for all contract Application Binary Interfaces
 */

// CrossMindVault Contract ABI
export const vaultABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "enum CrossMindVault.Risk",
            "name": "risk",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "locked",
            "type": "bool"
          }
        ],
        "internalType": "struct CrossMindVault.Balance[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// StrategyManager Contract ABI
export const strategyManagerABI = [
  {
    "inputs": [],
    "name": "getAllChains",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      }
    ],
    "name": "getAllProtocolsByChain",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "chainProtocols",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "adapter",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainId",
        "type": "uint64"
      }
    ],
    "name": "chains",
    "outputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainId",
        "type": "uint64"
      }
    ],
    "name": "isSupportedChainId",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "index",
            "type": "uint256"
          },
          {
            "internalType": "enum StrategyManager.Status",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "uint64",
                "name": "chainId",
                "type": "uint64"
              },
              {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
              },
              {
                "components": [
                  {
                    "internalType": "address",
                    "name": "adapter",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "percentage",
                    "type": "uint256"
                  }
                ],
                "internalType": "struct StrategyManager.AdapterDeposit[]",
                "name": "deposits",
                "type": "tuple[]"
              }
            ],
            "internalType": "struct StrategyManager.ChainDeposit[]",
            "name": "deposits",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct StrategyManager.Strategy",
        "name": "strategy",
        "type": "tuple"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "registerStrategy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Export all ABIs as a combined object for easy access
export const CrossMindABIs = {
  vault: vaultABI,
  strategyManager: strategyManagerABI,
} as const;

// Type definitions for better TypeScript support
export type VaultABI = typeof vaultABI;
export type StrategyManagerABI = typeof strategyManagerABI; 