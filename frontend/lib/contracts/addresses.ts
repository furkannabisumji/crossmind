import { mainnet, polygon, optimism, arbitrum, base, zora } from 'wagmi/chains';

/**
 * Contract addresses for all supported chains
 * Format: CONTRACT_NAME: { [chainId]: address }
 */
export const CONTRACT_ADDRESSES = {
  // Strategy Registry contract - manages user strategies
  StrategyRegistry: {
    [mainnet.id]: '0x1234567890123456789012345678901234567890', // Replace with actual address
    [polygon.id]: '0x2345678901234567890123456789012345678901', // Replace with actual address
    [optimism.id]: '0x3456789012345678901234567890123456789012', // Replace with actual address
    [arbitrum.id]: '0x4567890123456789012345678901234567890123', // Replace with actual address
    [base.id]: '0x5678901234567890123456789012345678901234',    // Replace with actual address
    [zora.id]: '0x6789012345678901234567890123456789012345',    // Replace with actual address
  },
  
  // Portfolio contract - tracks user portfolio data
  Portfolio: {
    [mainnet.id]: '0x7890123456789012345678901234567890123456', // Replace with actual address
    [polygon.id]: '0x8901234567890123456789012345678901234567', // Replace with actual address
    [optimism.id]: '0x9012345678901234567890123456789012345678', // Replace with actual address
    [arbitrum.id]: '0x0123456789012345678901234567890123456789', // Replace with actual address
    [base.id]: '0x1234567890123456789012345678901234567891',    // Replace with actual address
    [zora.id]: '0x2345678901234567890123456789012345678912',    // Replace with actual address
  },

  // CrossMindVault contract - manages user deposits
  CrossMindVault: {
    [mainnet.id]: '0xA234567890123456789012345678901234567890', // Replace with actual address
    [polygon.id]: '0xB345678901234567890123456789012345678901', // Replace with actual address
    [optimism.id]: '0xC456789012345678901234567890123456789012', // Replace with actual address
    [arbitrum.id]: '0xD567890123456789012345678901234567890123', // Replace with actual address
    [base.id]: '0xE678901234567890123456789012345678901234',    // Replace with actual address
    [zora.id]: '0xF789012345678901234567890123456789012345',    // Replace with actual address
  },

  // StrategyManager contract - executes multi-chain investment strategies
  StrategyManager: {
    [mainnet.id]: '0xAA34567890123456789012345678901234567890', // Replace with actual address
    [polygon.id]: '0xBB45678901234567890123456789012345678901', // Replace with actual address
    [optimism.id]: '0xCC56789012345678901234567890123456789012', // Replace with actual address
    [arbitrum.id]: '0xDD67890123456789012345678901234567890123', // Replace with actual address
    [base.id]: '0xEE78901234567890123456789012345678901234',    // Replace with actual address
    [zora.id]: '0xFF89012345678901234567890123456789012345',    // Replace with actual address
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
  return addresses[chainId as keyof typeof addresses] as `0x${string}` | undefined;
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
