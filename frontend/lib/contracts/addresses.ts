import { sepolia, avalancheFuji } from "wagmi/chains";

/**
 * Contract addresses for all supported chains
 * Format: CONTRACT_NAME: { [chainId]: address }
 */
export const CONTRACT_ADDRESSES = {
  // CrossMindVault contract - manages user deposits
  CrossMindVault: {
    [avalancheFuji.id]: "0x7A057215EAfDAa0d6d5A0FdfdebdE21794DE1b73",
    [sepolia.id]: "0xfA205DB4D93006837C0CAb69095bBB7d601c82E6",
  },

  // StrategyManager contract - executes multi-chain investment strategies
  StrategyManager: {
    [avalancheFuji.id]: "0xB07a95486F9B28933345Bce32396A15a38Fc43E0",
    [sepolia.id]: "0x5488BF397b074d8Efee58F315c0a2f793FCCEd75",
  },

  // CrossChainExecutor contract - handles cross-chain operations
  CrossChainExecutor: {
    [avalancheFuji.id]: "0xbb6868A91dE8a56565B0a290fb04648a8750d657",
    [sepolia.id]: "0x82DCF4603a7f24aa6633B821fFC51032Cee21063",
  },

  // AdapterRegistry contract - manages protocol adapters
  AdapterRegistry: {
    [avalancheFuji.id]: "0x166972C8926F50d7124d17f959ee2FC170217b1f",
    [sepolia.id]: "0x3014A74fd44017341dD471C73e9980D156c7Bc02",
  },

  // AaveV3Adapter contract - adapter for Aave V3 protocol
  AaveV3Adapter: {
    [avalancheFuji.id]: "0x4c1E4c5378eEfdbAc9C9CD1517Df5b583F9a95B3",
    [sepolia.id]: "0xB361aB7b925c8F094F16407702d6fD275534d981",
  },

  USDC: {
    [avalancheFuji.id]: "0x5425890298aed601595a70AB815c96711a31Bc65",
    [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
} as const;

/**
 * Type-safe helper to get contract address for a specific chain
 *
 * @param contractName Name of the contract from CONTRACT_ADDRESSES
 * @param chainId Chain ID to get address for
 * @returns Contract address as 0x-prefixed string or undefined if not available
 */
export function getContractAddress(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  chainId: number
): `0x${string}` | undefined {
  const addresses = CONTRACT_ADDRESSES[contractName];
  // Use type assertion to handle the chainId indexing
  return addresses[chainId as keyof typeof addresses] as
    | `0x${string}`
    | undefined;
}

/**
 * Check if a contract is deployed on a specific chain
 *
 * @param contractName Name of the contract from CONTRACT_ADDRESSES
 * @param chainId Chain ID to check
 * @returns Boolean indicating if contract is available on the chain
 */
export function isContractDeployedOnChain(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  chainId: number
): boolean {
  const address = getContractAddress(contractName, chainId);
  return !!address;
}
