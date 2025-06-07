import { ethers } from 'ethers';
import { Chain } from '../generated/prisma';
import { getRpcUrl } from './blockchainUtils';

// Contract ABIs
const CrossMindVaultABI = [
  'function deposit(uint256 _amount) external',
  'function withdraw(uint256 _index) external',
  'function getBalance(address user) external view returns (tuple(uint256 amount, bool locked)[])',
  'event Deposit(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)'
];

const StrategyManagerABI = [
  'function executeStrategy(tuple(uint64 chainId, uint256 index, tuple(address adapter, uint256 percentage)[])[] strategy, uint256 index) external',
  'function exitStrategyRequest(uint256 index) external',
  'function getVaults(address user) public view returns (tuple(uint256 index, uint64 chainId, bool exited, uint256 amount)[])',
  'function getProtocols(uint64 chainId) external view returns (tuple(string name, address adapter)[])',
  'event StrategyExecuted(address user, uint256 amount)'
];

const AdapterRegistryABI = [
  'function getAdapters() external view returns (address[])',
  'function getBalance(uint256 _index) public view returns (tuple(address adapter, uint256 amount)[])'
];

const CrossChainExecutorABI = [
  'function sendMessageOrToken(uint64 destinationChainSelector, address receiver, string memory action, uint256 index, tuple(address adapter, uint256 percentage)[] memory deposits, uint256 amount) external returns (bytes32 messageId)',
  'event MessageSent(bytes32 indexed messageId, uint64 indexed destinationChainSelector, address receiver, string action, address feeToken, uint256 fees)'
];

// Contract addresses - these should be loaded from environment variables or config
// Now organized by chain to support multi-chain deployment
const contractAddresses: Record<Chain, {
  vault: string;
  strategyManager: string;
  adapterRegistry: string;
  crossChainExecutor: string;
  token: string;
}> = {
  [Chain.ETHEREUM]: {
    vault: process.env.ETH_VAULT_ADDRESS || '',
    strategyManager: process.env.ETH_STRATEGY_MANAGER_ADDRESS || '',
    adapterRegistry: process.env.ETH_ADAPTER_REGISTRY_ADDRESS || '',
    crossChainExecutor: process.env.ETH_CROSS_CHAIN_EXECUTOR_ADDRESS || '',
    token: process.env.ETH_TOKEN_ADDRESS || ''
  },
  [Chain.AVALANCHE]: {
    vault: process.env.AVAX_VAULT_ADDRESS || '',
    strategyManager: process.env.AVAX_STRATEGY_MANAGER_ADDRESS || '',
    adapterRegistry: process.env.AVAX_ADAPTER_REGISTRY_ADDRESS || '',
    crossChainExecutor: process.env.AVAX_CROSS_CHAIN_EXECUTOR_ADDRESS || '',
    token: process.env.AVAX_TOKEN_ADDRESS || ''
  },
  [Chain.BASE]: {
    vault: process.env.BASE_VAULT_ADDRESS || '',
    strategyManager: process.env.BASE_STRATEGY_MANAGER_ADDRESS || '',
    adapterRegistry: process.env.BASE_ADAPTER_REGISTRY_ADDRESS || '',
    crossChainExecutor: process.env.BASE_CROSS_CHAIN_EXECUTOR_ADDRESS || '',
    token: process.env.BASE_TOKEN_ADDRESS || ''
  },
  [Chain.ARBITRUM]: {
    vault: process.env.ARB_VAULT_ADDRESS || '',
    strategyManager: process.env.ARB_STRATEGY_MANAGER_ADDRESS || '',
    adapterRegistry: process.env.ARB_ADAPTER_REGISTRY_ADDRESS || '',
    crossChainExecutor: process.env.ARB_CROSS_CHAIN_EXECUTOR_ADDRESS || '',
    token: process.env.ARB_TOKEN_ADDRESS || ''
  },
  [Chain.POLYGON]: {
    vault: process.env.POLY_VAULT_ADDRESS || '',
    strategyManager: process.env.POLY_STRATEGY_MANAGER_ADDRESS || '',
    adapterRegistry: process.env.POLY_ADAPTER_REGISTRY_ADDRESS || '',
    crossChainExecutor: process.env.POLY_CROSS_CHAIN_EXECUTOR_ADDRESS || '',
    token: process.env.POLY_TOKEN_ADDRESS || ''
  },
  [Chain.OPTIMISM]: {
    vault: process.env.OP_VAULT_ADDRESS || '',
    strategyManager: process.env.OP_STRATEGY_MANAGER_ADDRESS || '',
    adapterRegistry: process.env.OP_ADAPTER_REGISTRY_ADDRESS || '',
    crossChainExecutor: process.env.OP_CROSS_CHAIN_EXECUTOR_ADDRESS || '',
    token: process.env.OP_TOKEN_ADDRESS || ''
  }
};

// Chain ID mapping
const chainIdMap: Record<Chain, number> = {
  ETHEREUM: 1,
  AVALANCHE: 43114,
  BASE: 8453,
  ARBITRUM: 42161,
  POLYGON: 137,
  OPTIMISM: 10
};

// CCIP Chain Selectors for cross-chain communication
const ccipChainSelectors: Record<Chain, string> = {
  ETHEREUM: '0x5009', // Ethereum Sepolia testnet
  AVALANCHE: '0x9f2c', // Avalanche Fuji testnet
  BASE: '0x14a33', // Base Goerli testnet
  ARBITRUM: '0xa13a', // Arbitrum Goerli testnet
  POLYGON: '0x6e2dc', // Polygon Mumbai testnet
  OPTIMISM: '0x2105', // Optimism Goerli testnet
};

/**
 * Get a contract instance
 * @param contractName Name of the contract
 * @param chain Blockchain network
 * @param signer Optional signer for transactions
 * @returns Contract instance
 */
export const getContract = (
  contractName: 'vault' | 'strategyManager' | 'adapterRegistry' | 'crossChainExecutor',
  chain: Chain,
  signer?: ethers.Signer
) => {
  const rpcUrl = getRpcUrl(chain);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const chainContracts = contractAddresses[chain];
  if (!chainContracts) {
    throw new Error(`Contract addresses not found for chain ${chain}`);
  }
  
  const address = chainContracts[contractName];
  if (!address) {
    throw new Error(`Contract address not found for ${contractName} on chain ${chain}`);
  }
  
  let abi;
  switch (contractName) {
    case 'vault':
      abi = CrossMindVaultABI;
      break;
    case 'strategyManager':
      abi = StrategyManagerABI;
      break;
    case 'adapterRegistry':
      abi = AdapterRegistryABI;
      break;
    case 'crossChainExecutor':
      abi = CrossChainExecutorABI;
      break;
    default:
      throw new Error(`Unknown contract name: ${contractName}`);
  }
  
  return new ethers.Contract(
    address,
    abi,
    signer || provider
  );
};

/**
 * Deposit funds into the CrossMindVault
 * @param amount Amount to deposit
 * @param walletAddress User's wallet address
 * @param chain Blockchain network
 * @returns Transaction hash
 */
export const depositToVault = async (
  amount: number,
  walletAddress: string,
  chain: Chain = Chain.ETHEREUM
): Promise<string> => {
  try {
    // In a real implementation, you would:
    // 1. Connect to the user's wallet using a signer
    // 2. Approve the token transfer to the vault
    // 3. Call the deposit function on the vault contract
    
    console.log(`Depositing ${amount} tokens to vault for ${walletAddress} on ${chain}`);
    
    // Mock implementation for development
    return `0x${Math.random().toString(16).substring(2, 42)}`;
  } catch (error) {
    console.error('Error depositing to vault:', error);
    throw new Error('Failed to deposit to vault');
  }
};

/**
 * Withdraw funds from the CrossMindVault
 * @param index Index of the balance to withdraw
 * @param walletAddress User's wallet address
 * @param chain Blockchain network
 * @returns Transaction hash
 */
export const withdrawFromVault = async (
  index: number,
  walletAddress: string,
  chain: Chain = Chain.ETHEREUM
): Promise<string> => {
  try {
    console.log(`Withdrawing balance at index ${index} for ${walletAddress} on ${chain}`);
    
    // Mock implementation for development
    return `0x${Math.random().toString(16).substring(2, 42)}`;
  } catch (error) {
    console.error('Error withdrawing from vault:', error);
    throw new Error('Failed to withdraw from vault');
  }
};

/**
 * Execute a cross-chain investment strategy
 * @param strategies Array of strategies to execute
 * @param index Index of the balance to use
 * @param walletAddress User's wallet address
 * @param chain Blockchain network
 * @returns Transaction hash
 */
export const executeStrategy = async (
  strategies: Array<{
    chainId: number;
    index: number;
    deposits: Array<{
      adapter: string;
      percentage: number;
    }>;
  }>,
  index: number,
  walletAddress: string,
  chain: Chain = Chain.ETHEREUM
): Promise<string> => {
  try {
    console.log(`Executing strategy for ${walletAddress} using balance index ${index}`);
    console.log('Strategies:', JSON.stringify(strategies));
    
    // Mock implementation for development
    return `0x${Math.random().toString(16).substring(2, 42)}`;
  } catch (error) {
    console.error('Error executing strategy:', error);
    throw new Error('Failed to execute strategy');
  }
};

/**
 * Request to exit a strategy
 * @param index Index of the strategy to exit
 * @param walletAddress User's wallet address
 * @param chain Blockchain network
 * @returns Transaction hash
 */
export const exitStrategy = async (
  index: number,
  walletAddress: string,
  chain: Chain = Chain.ETHEREUM
): Promise<string> => {
  try {
    console.log(`Exiting strategy at index ${index} for ${walletAddress} on ${chain}`);
    
    // Mock implementation for development
    return `0x${Math.random().toString(16).substring(2, 42)}`;
  } catch (error) {
    console.error('Error exiting strategy:', error);
    throw new Error('Failed to exit strategy');
  }
};

/**
 * Get user balances from the vault
 * @param walletAddress User's wallet address
 * @param chain Blockchain network
 * @returns Array of balances
 */
export const getVaultBalances = async (
  walletAddress: string,
  chain: Chain = Chain.ETHEREUM
): Promise<Array<{ amount: string; locked: boolean }>> => {
  try {
    console.log(`Getting vault balances for ${walletAddress} on ${chain}`);
    
    // Mock implementation for development
    return [
      { amount: ethers.parseEther('1.5').toString(), locked: false },
      { amount: ethers.parseEther('2.0').toString(), locked: true }
    ];
  } catch (error) {
    console.error('Error getting vault balances:', error);
    throw new Error('Failed to get vault balances');
  }
};

/**
 * Get user's executed strategies
 * @param walletAddress User's wallet address
 * @param chain Blockchain network
 * @returns Array of executed strategies
 */
export const getExecutedStrategies = async (
  walletAddress: string,
  chain: Chain = Chain.ETHEREUM
): Promise<Array<{ index: number; chainId: number; exited: boolean; amount: string }>> => {
  try {
    console.log(`Getting executed strategies for ${walletAddress} on ${chain}`);
    
    // Mock implementation for development
    return [
      { index: 0, chainId: chainIdMap[Chain.ETHEREUM], exited: false, amount: ethers.parseEther('1.0').toString() },
      { index: 1, chainId: chainIdMap[Chain.AVALANCHE], exited: true, amount: ethers.parseEther('0.5').toString() }
    ];
  } catch (error) {
    console.error('Error getting executed strategies:', error);
    throw new Error('Failed to get executed strategies');
  }
};

/**
 * Get available protocols for a specific chain
 * @param chainId Chain ID
 * @param chain Blockchain network for the contract call
 * @returns Array of protocols
 */
export const getProtocols = async (
  chainId: number,
  chain: Chain = Chain.ETHEREUM
): Promise<Array<{ name: string; adapter: string }>> => {
  try {
    console.log(`Getting protocols for chain ID ${chainId}`);
    
    // Mock implementation for development
    return [
      { name: 'Aave Lending', adapter: '0x1234567890123456789012345678901234567890' },
      { name: 'Uniswap LP', adapter: '0x0987654321098765432109876543210987654321' }
    ];
  } catch (error) {
    console.error('Error getting protocols:', error);
    throw new Error('Failed to get protocols');
  }
};

/**
 * Convert Chain enum to chain ID
 * @param chain Chain enum
 * @returns Chain ID
 */
export const getChainId = (chain: Chain): number => {
  return chainIdMap[chain] || chainIdMap[Chain.ETHEREUM];
};

/**
 * Convert chain ID to Chain enum
 * @param chainId Chain ID
 * @returns Chain enum
 */
export const getChainEnum = (chainId: number): Chain => {
  for (const [chain, id] of Object.entries(chainIdMap)) {
    if (id === chainId) {
      return chain as Chain;
    }
  }
  return Chain.ETHEREUM; // Default fallback
};
