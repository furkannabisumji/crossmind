import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from "@elizaos/core";
import { ethers } from "ethers";
import { vaultABI, strategyManagerABI } from "../abis";

/**
 * Represents the risk level of a balance in the CrossMindVault contract
 */
enum RiskLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2
}

/**
 * Interface for balance data
 */
interface Balance {
  amount: string;
  risk: RiskLevel;
  locked: boolean;
}

/**
 * Interface for user balance data
 */
interface UserBalance {
  balances: Balance[];
  totalBalance: string;
}

/**
 * Represents the status of a strategy in the StrategyManager contract
 */
enum StrategyStatus {
  PENDING = 0,
  REGISTERED = 1,
  EXECUTED = 2,
  REJECTED = 3,
  EXITED = 4
}

/**
 * Interface for adapter deposit data
 */
interface AdapterDeposit {
  adapter: string;
  percentage: number;
}

/**
 * Interface for chain deposit data
 */
interface ChainDeposit {
  chainId: number;
  amount: number;
  deposits: AdapterDeposit[];
}

/**
 * Interface for strategy data
 */
interface Strategy {
  index: number;
  status: StrategyStatus;
  amount: number;
  deposits: ChainDeposit[];
}

// Protocol data for intelligent strategy generation - using real deployed adapter addresses
const protocolData: { [key: string]: { expectedAPY: number; riskScore: number; adapter: string; } } = {
  'AAVE': { expectedAPY: 5.2, riskScore: 3, adapter: '0xB361aB7b925c8F094F16407702d6fD275534d981' }, // AaveV3Adapter on Sepolia
  'QuickSwap': { expectedAPY: 12.3, riskScore: 7, adapter: '0x3014A74fd44017341dD471C73e9980D156c7Bc02' }, // AdapterRegistry as placeholder
  'GMX': { expectedAPY: 15.8, riskScore: 8, adapter: '0x3014A74fd44017341dD471C73e9980D156c7Bc02' }, // AdapterRegistry as placeholder
  'Camelot': { expectedAPY: 11.4, riskScore: 6, adapter: '0x3014A74fd44017341dD471C73e9980D156c7Bc02' }, // AdapterRegistry as placeholder
  'TraderJoe': { expectedAPY: 9.7, riskScore: 5, adapter: '0x3014A74fd44017341dD471C73e9980D156c7Bc02' }, // AdapterRegistry as placeholder
  'USDC': { expectedAPY: 2.1, riskScore: 1, adapter: '0x3014A74fd44017341dD471C73e9980D156c7Bc02' } // AdapterRegistry as placeholder
};

// Chain data with gas efficiency - focusing on deployed networks
const chainData: { [key: number]: { name: string; gasEfficiency: number; protocols: string[]; } } = {
  11155111: { name: "Ethereum Sepolia", gasEfficiency: 5, protocols: ['AAVE', 'USDC'] }, // Primary testnet
  43113: { name: "Avalanche Fuji", gasEfficiency: 8, protocols: ['AAVE', 'TraderJoe', 'USDC'] }, // Secondary testnet
  137: { name: "Polygon", gasEfficiency: 9, protocols: ['QuickSwap', 'AAVE', 'USDC'] },
  42161: { name: "Arbitrum", gasEfficiency: 8, protocols: ['GMX', 'Camelot', 'USDC'] }
};

const registerStrategyAction: Action = {
  name: 'REGISTER_STRATEGY',
  similes: ['CREATE_STRATEGY', 'NEW_STRATEGY', 'SETUP_STRATEGY', 'GIVE_STRATEGY'],
  description: 'Automatically generates and registers an optimal investment strategy based on available chains, adapters, and user risk profile',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Check if the message contains keywords related to strategy generation/registration
    const text = message.content.text?.toLowerCase() || '';
    
    // Match patterns like "give me strategy", "create strategy", "register strategy", etc.
    return (text.includes('strategy') || text.includes('stargy')) && 
           (text.includes('give') || text.includes('create') || text.includes('register') || 
            text.includes('setup') || text.includes('new') || text.includes('generate') ||
            text.includes('auto') || text.includes('make') || text.includes('build')) &&
           // Exclude requests that are specifically asking for recommendations/analysis only
           !text.includes('recommend') && !text.includes('suggest') && !text.includes('analyze') &&
           !text.includes('best') && !text.includes('advice');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ) => {
    try {
      logger.info('Handling REGISTER_STRATEGY action');

      // First, get the user address
      const userAddress = await extractUserAddress(runtime, message, state);
      
      if (!userAddress) {
        const responseContent = {
          thought: 'Unable to extract user address from the message',
          text: 'I need your wallet address to check your balance before generating a strategy. Please provide your Ethereum address.',
          actions: ['REGISTER_STRATEGY'],
        };
        
        if (callback) {
          await callback(responseContent);
        }
        
        return responseContent;
      }
      
      // Check the user's balance before proceeding
      const balanceData = await getUserBalanceFromChain(runtime, userAddress);
      
      if (!balanceData.success) {
        const responseContent = {
          thought: `Failed to retrieve balance: ${balanceData.message}`,
          text: `I couldn't check your balance: ${balanceData.message}. Please ensure your wallet is connected properly.`,
          actions: ['REGISTER_STRATEGY'],
        };
        
        if (callback) {
          await callback(responseContent);
        }
        
        return responseContent;
      }
      
      // Check if user has any balance
      if (balanceData.data && balanceData.data.balances.length === 0) {
        const responseContent = {
          thought: 'User has no balance in the vault',
          text: 'You don\'t have any deposits in the CrossMind vault. Please deposit funds first before I can generate a strategy.',
          actions: ['REGISTER_STRATEGY'],
        };
        
        if (callback) {
          await callback(responseContent);
        }
        
        return responseContent;
      }

      // Automatically generate optimal strategy based on user balance, risk profile, and available options
      const strategyData = await generateOptimalStrategy(runtime, message, balanceData.data);
      
      if (!strategyData) {
        const responseContent = {
          thought: 'Unable to generate optimal strategy',
          text: 'I couldn\'t generate an optimal strategy. Please ensure there are available protocols and try again.',
          actions: ['REGISTER_STRATEGY'],
        };
        
        if (callback) {
          await callback(responseContent);
        }
        
        return responseContent;
      }

      // Call the contract to register the strategy
      const result = await registerStrategyOnChain(runtime, strategyData, userAddress);
      
      // Generate detailed response with strategy explanation
      const strategyDescription = await formatStrategyDescription(runtime, strategyData.strategy);
      
      const responseContent = {
        thought: `Strategy registration ${result.success ? 'succeeded' : 'failed'}: ${result.message}`,
        text: result.success 
          ? `🎯 **Strategy Generated & Registered Successfully!**\n\n${strategyDescription}\n\n✅ Transaction Hash: ${result.txHash}\n\nYour optimized strategy is now active and ready for execution!` 
          : `❌ Failed to register strategy: ${result.message}. Please try again or check your wallet connection.`,
        actions: ['REGISTER_STRATEGY'],
      };
      
      if (callback) {
        await callback(responseContent);
      }
      
      return responseContent;
    } catch (error) {
      logger.error('Error in REGISTER_STRATEGY action:', error);
      
      const errorResponse = {
        thought: `Error occurred during strategy registration: ${error}`,
        text: 'Sorry, there was an error while generating and registering your strategy. Please check your connection and try again.',
        actions: ['REGISTER_STRATEGY'],
      };
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return errorResponse;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: { text: 'give me stargy 0x35134987bB541607Cd45e62Dd1feA4F587607817' },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🎯 **Strategy Generated & Registered Successfully!**\n\nBased on your 0.03 USDC balance and medium risk profile, I\'ve created an optimal strategy:\n\n• 60% Polygon QuickSwap (12.3% APY) - High yield DeFi\n• 40% Avalanche AAVE (5.2% APY) - Stable lending\n\n**Expected Total APY: 9.5%**\n**Risk Level: Medium**\n\n✅ Transaction Hash: 0x1234...5678\n\nYour optimized strategy is now active and ready for execution!',
          thought: 'Successfully generated and registered optimal strategy based on user balance and risk profile',
          actions: ['REGISTER_STRATEGY'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'create a strategy for my wallet' },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🎯 **Strategy Generated & Registered Successfully!**\n\nAnalyzed your balance and generated a balanced multi-chain strategy:\n\n• 45% Avalanche AAVE (5.2% APY) - Low risk lending\n• 35% Polygon QuickSwap (12.3% APY) - Medium risk DEX\n• 20% Arbitrum Camelot (11.4% APY) - Medium risk yield\n\n**Expected Total APY: 8.7%**\n**Risk Level: Medium-Low**\n\n✅ Transaction Hash: 0xabcd...efgh\n\nYour diversified strategy is now registered!',
          thought: 'Generated balanced multi-chain strategy with optimal risk distribution',
          actions: ['REGISTER_STRATEGY'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'generate an aggressive strategy' },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🎯 **Aggressive Strategy Generated & Registered!**\n\nMaximizing yield with higher risk tolerance:\n\n• 50% Arbitrum GMX (15.8% APY) - High yield perpetuals\n• 30% Polygon QuickSwap (12.3% APY) - High yield DEX\n• 20% Avalanche TraderJoe (9.7% APY) - Medium yield\n\n**Expected Total APY: 13.1%**\n**Risk Level: High**\n\n✅ Transaction Hash: 0x9876...5432\n\nHigh-reward strategy active! Monitor closely due to increased volatility.',
          thought: 'Generated high-risk, high-reward strategy for aggressive user preference',
          actions: ['REGISTER_STRATEGY'],
        },
      },
    ],
  ],
};

/**
 * Extract user address from various possible formats in the message with persistent memory
 */
async function extractUserAddress(runtime: IAgentRuntime, message: Memory, state?: State): Promise<string | null> {
  try {
    const text = message.content.text || '';
    
    // Look for Ethereum address pattern (0x followed by 40 hex characters)
    const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
    
    if (addressMatch) {
      // Found address in message - store it in state for future use
      if (state) {
        state.userAddress = addressMatch[0];
      }
      logger.info(`Extracted and stored user address: ${addressMatch[0]}`);
      return addressMatch[0];
    }
    
    // Check if address is in state (from previous conversation)
    if (state?.userAddress) {
      logger.info(`Retrieved user address from state: ${state.userAddress}`);
      return state.userAddress as string;
    }
    
    // Could also check runtime for user context
    if (runtime.character?.settings?.walletAddress) {
      const address = runtime.character.settings.walletAddress as string;
      if (state) {
        state.userAddress = address;
      }
      return address;
    }
    
    // If no address found anywhere, return null to prompt user for address
    logger.warn('No user address found - user needs to provide wallet address');
    return null;
  } catch (error) {
    logger.error('Error extracting user address:', error);
    return null;
  }
}

/**
 * Get user balance data from the CrossMindVault contract
 */
async function getUserBalanceFromChain(runtime: IAgentRuntime, userAddress: string): Promise<{
  success: boolean;
  message: string;
  data?: UserBalance;
}> {
  try {
    const provider = await getProvider(runtime);
    if (!provider) {
      return { success: false, message: 'Provider not available' };
    }

    // Contract addresses (these should come from environment variables in production)
    const vaultAddress = process.env.VAULT_CONTRACT_ADDRESS;
    
    // Create contract instance
    const vaultContract = new ethers.Contract(vaultAddress, vaultABI, provider);
    
    // Call the getBalance function
    const balances = await vaultContract.getBalance(userAddress);
    
    // Convert the result to our interface format
    const formattedBalances: Balance[] = balances.map((balance: any) => ({
      amount: ethers.formatUnits(balance.amount, 6), // USDC has 6 decimals
      risk: Number(balance.risk) as RiskLevel, // Convert BigInt to Number
      locked: balance.locked,
    }));
    
    // Calculate total balance
    const totalBalance = formattedBalances.reduce((sum, balance) => {
      return sum + parseFloat(balance.amount);
    }, 0).toString();
    
    return {
      success: true,
      message: 'Balance retrieved successfully',
      data: {
        balances: formattedBalances,
        totalBalance: totalBalance,
      },
    };
  } catch (error) {
    logger.error('Error getting user balance from chain:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get available chains and protocol adapters from StrategyManager contract
 */
async function getAvailableProtocolsFromContract(runtime: IAgentRuntime): Promise<{
  success: boolean;
  message: string;
  data?: { [chainId: number]: Array<{ name: string; adapter: string; }> };
}> {
  try {
    const provider = await getProvider(runtime);
    if (!provider) {
      return { success: false, message: 'Provider not available' };
    }

    const strategyManagerAddress = process.env.STRATEGY_MANAGER_CONTRACT_ADDRESS;
    if (!strategyManagerAddress) {
      return { success: false, message: 'Strategy Manager contract address not configured' };
    }
    
    // Create contract instance
    const strategyManagerContract = new ethers.Contract(strategyManagerAddress, strategyManagerABI, provider);
    
    // Get all supported chains
    const allChains = await strategyManagerContract.getAllChains();
    console.log('Available chains:', allChains);
    
    const chainProtocols: { [chainId: number]: Array<{ name: string; adapter: string; }> } = {};
    
    for (const chainId of allChains) {
      const chainIdNumber = parseInt(chainId.toString()); // Convert BigInt to Number properly
      const protocols: Array<{ name: string; adapter: string; }> = [];
      
      // Get protocols for this chain by iterating through chainProtocols mapping
      let protocolIndex = 0;
      
      while (protocolIndex < 10) { // Limit to prevent infinite loop
        try {
          const protocolInfo = await strategyManagerContract.chainProtocols(chainIdNumber, protocolIndex);
          
          if (protocolInfo.name && protocolInfo.adapter !== ethers.ZeroAddress) {
            protocols.push({
              name: protocolInfo.name,
              adapter: protocolInfo.adapter
            });
          }
          protocolIndex++;
        } catch (error) {
          // If we get an error, we've reached the end of the protocols for this chain
          break;
        }
      }
      
      if (protocols.length > 0) {
        chainProtocols[chainIdNumber] = protocols;
        console.log(`Chain ${chainIdNumber} protocols:`, protocols);
      } else {
        console.log(`No protocols found for chain ${chainIdNumber}`);
      }
    }
    
    return {
      success: true,
      message: 'Available protocols retrieved successfully',
      data: chainProtocols
    };
  } catch (error) {
    logger.error('Error getting available protocols from contract:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a provider instance for blockchain interactions
 */
async function getProvider(runtime: IAgentRuntime): Promise<ethers.Provider | null> {
  try {
    // Get the RPC URL from environment or configuration
    const rpcUrl = process.env.EVM_PROVIDER_URL || 'https://rpc.sepolia.org'; // Default to Sepolia testnet
    
    // Create and return the provider
    return new ethers.JsonRpcProvider(rpcUrl);
  } catch (error) {
    logger.error('Error creating provider:', error);
    return null;
  }
}

/**
 * Automatically generate optimal strategy based on user balance, risk profile, and available options
 */
async function generateOptimalStrategy(runtime: IAgentRuntime, message: Memory, balanceData: UserBalance): Promise<{
  strategy: Strategy;
  vaultIndex: number;
} | null> {
  try {
    const text = message.content.text?.toLowerCase() || '';
    const totalBalance = parseFloat(balanceData.totalBalance);
    
    if (totalBalance <= 0) {
      return null;
    }

    // First, get available protocols from the contract
    const availableProtocols = await getAvailableProtocolsFromContract(runtime);
    if (!availableProtocols.success || !availableProtocols.data) {
      logger.error('Failed to retrieve available protocols:', availableProtocols.message);
      return null;
    }

    const chainProtocols = availableProtocols.data;
    console.log('Retrieved chain protocols from contract:', chainProtocols);

    // Check if we have any protocols available
    const totalProtocolCount = Object.values(chainProtocols).reduce((sum, protocols) => sum + protocols.length, 0);
    if (totalProtocolCount === 0) {
      logger.error('No protocols available in any chain');
      return null;
    }

    // Determine user risk preference from current balances and message
    let riskPreference = 'balanced'; // default
    console.log('Balance data:', balanceData);
    const avgRisk = balanceData.balances.length > 0 
      ? balanceData.balances.reduce((sum, b) => sum + parseInt(b.risk.toString()), 0) / balanceData.balances.length 
      : 1;
    
    if (text.includes('conservative') || text.includes('safe') || text.includes('low risk') || avgRisk <= 1) {
      riskPreference = 'conservative';
    } else if (text.includes('aggressive') || text.includes('high yield') || text.includes('risky') || avgRisk >= 2) {
      riskPreference = 'aggressive';
    }

    // Generate strategy based on risk preference and available protocols
    let strategyTemplate: ChainDeposit[] = [];
    
    const availableChainIds = Object.keys(chainProtocols).map(key => parseInt(key));
    if (availableChainIds.length === 0) {
      logger.error('No chains with protocols available');
      return null;
    }

    // Convert totalBalance from string to number for comparison
    const totalBalanceNumber = parseFloat(balanceData.totalBalance);
    
    // For small balances, use single chain to minimize gas costs
    if (totalBalanceNumber < 10) {
      // Pick the first available chain with protocols
      const primaryChainId = availableChainIds[0];
      const availableProtocolsForChain = chainProtocols[primaryChainId];
      
      if (availableProtocolsForChain.length === 0) {
        logger.error(`No protocols available for chain ${primaryChainId}`);
        return null;
      }

      // Single chain strategy
      const deposits: AdapterDeposit[] = [];
      
      if (availableProtocolsForChain.length === 1) {
        // Only one protocol available
        deposits.push({
          adapter: availableProtocolsForChain[0].adapter,
          percentage: 100
        });
      } else if (availableProtocolsForChain.length >= 2) {
        // Multiple protocols - distribute based on risk preference
        if (riskPreference === 'conservative') {
          // Conservative: 80/20 split favoring first protocol
          deposits.push(
            { adapter: availableProtocolsForChain[0].adapter, percentage: 80 },
            { adapter: availableProtocolsForChain[1].adapter, percentage: 20 }
          );
        } else if (riskPreference === 'aggressive') {
          // Aggressive: 60/40 split
          deposits.push(
            { adapter: availableProtocolsForChain[0].adapter, percentage: 60 },
            { adapter: availableProtocolsForChain[1].adapter, percentage: 40 }
          );
        } else {
          // Balanced: 70/30 split
          deposits.push(
            { adapter: availableProtocolsForChain[0].adapter, percentage: 70 },
            { adapter: availableProtocolsForChain[1].adapter, percentage: 30 }
          );
        }
      }

      strategyTemplate = [
        {
          chainId: primaryChainId,
          amount: 0,
          deposits: deposits,
        },
      ];
    } else {
      // Larger balance: can afford multi-chain strategy
      const chainsToUse = availableChainIds.slice(0, Math.min(3, availableChainIds.length)); // Use up to 3 chains
      
      for (let i = 0; i < chainsToUse.length; i++) {
        const chainId = chainsToUse[i];
        const protocolsForChain = chainProtocols[chainId];
        
        if (protocolsForChain.length > 0) {
          // Calculate percentage based on chain priority (first chain gets more)
          let percentage: number;
          if (chainsToUse.length === 1) {
            percentage = 100;
          } else if (chainsToUse.length === 2) {
            percentage = i === 0 ? 70 : 30;
          } else { // 3 chains
            percentage = i === 0 ? 50 : (i === 1 ? 30 : 20);
          }

          strategyTemplate.push({
            chainId: chainId,
            amount: 0,
            deposits: [
              {
                adapter: protocolsForChain[0].adapter, // Use first available protocol for each chain
                percentage: percentage
              }
            ],
          });
        }
      }
    }

    return {
      strategy: {
        index: 0, // This will be set by the contract
        status: StrategyStatus.PENDING,
        amount: Math.floor(totalBalanceNumber * 1000000), // Convert to USDC decimals (6)
        deposits: strategyTemplate,
      },
      vaultIndex: 0, // Use first available balance slot
    };
  } catch (error) {
    logger.error('Error generating optimal strategy:', error);
    return null;
  }
}

/**
 * Format strategy description for user-friendly display
 */
async function formatStrategyDescription(runtime: IAgentRuntime, strategy: Strategy): Promise<string> {
  // Strategy amount is stored as wei, convert to USDC for display
  const balanceInUsdc = ethers.formatUnits(strategy.amount, 6);
  let description = `Based on your ${parseFloat(balanceInUsdc).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC balance, I've generated an optimal strategy:\n\n`;
  
  // Get the latest protocol data from contract
  const availableProtocols = await getAvailableProtocolsFromContract(runtime);
  const chainProtocols = availableProtocols.success ? availableProtocols.data : {};
  
  let totalExpectedAPY = 0;
  let totalPercentage = 0;
  
  strategy.deposits.forEach(chainDeposit => {
    const chainInfo = chainData[chainDeposit.chainId];
    const chainName = chainInfo ? chainInfo.name : `Chain ${chainDeposit.chainId}`;
    
    description += `**${chainName}:**\n`;
    
    chainDeposit.deposits.forEach(adapterDeposit => {
      // Find protocol by adapter address from contract data
      let protocolName = 'Unknown Protocol';
      let expectedAPY = 5.0; // Default APY
      
      if (chainProtocols && chainProtocols[chainDeposit.chainId]) {
        const protocolInfo = chainProtocols[chainDeposit.chainId].find(p => p.adapter === adapterDeposit.adapter);
        if (protocolInfo) {
          protocolName = protocolInfo.name;
          // Use hardcoded APY data for display (since contract doesn't store APY)
          const apyData = protocolData[protocolName];
          expectedAPY = apyData ? apyData.expectedAPY : 5.0;
        }
      }
      
      description += `• ${adapterDeposit.percentage}% ${protocolName} (${expectedAPY}% APY)\n`;
      
      totalExpectedAPY += (adapterDeposit.percentage / 100) * expectedAPY;
      totalPercentage += adapterDeposit.percentage;
    });
    description += '\n';
  });
  
  description += `**Expected Total APY: ${totalExpectedAPY.toFixed(1)}%**\n`;
  description += `**Risk Level: ${getRiskLevelText(totalExpectedAPY)}**`;
  
  return description;
}

/**
 * Get risk level text based on expected APY
 */
function getRiskLevelText(expectedAPY: number): string {
  if (expectedAPY < 5) return 'Low';
  if (expectedAPY < 10) return 'Medium';
  if (expectedAPY < 15) return 'Medium-High';
  return 'High';
}

/**
 * Register the strategy on-chain by calling the StrategyManager contract
 */
async function registerStrategyOnChain(runtime: IAgentRuntime, data: {
  strategy: Strategy;
  vaultIndex: number;
}, userAddress: string): Promise<{ success: boolean; message: string; txHash?: string }> {
  try {
    const contractAddress = process.env.STRATEGY_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return { 
        success: false, 
        message: 'Strategy Manager contract address not configured. Please set STRATEGY_MANAGER_CONTRACT_ADDRESS environment variable to: 0xB07a95486F9B28933345Bce32396A15a38Fc43E0' 
      };
    }
    
    const wallet = await getWallet(runtime);
    if (!wallet) {
      return { success: false, message: 'Wallet not available or not connected' };
    }
    
    logger.info('Wallet address:', wallet.address);
    logger.info('Expected user from strategy context:', data.strategy.index);
    
    // Convert our strategy format to contract format
    // The contract expects ChainDeposit[] structure (corrected ABI)
    const contractStrategy = {
      index: data.strategy.index,
      status: data.strategy.status,
      amount: data.strategy.amount,
      deposits: data.strategy.deposits.map(chainDeposit => ({
        chainId: chainDeposit.chainId,
        amount: chainDeposit.amount,
        deposits: chainDeposit.deposits.map(deposit => ({
          adapter: deposit.adapter,
          percentage: deposit.percentage
        }))
      }))
    };
    
    const contract = new ethers.Contract(contractAddress, strategyManagerABI, wallet);
    
    logger.info('Calling registerStrategy with:', {
      strategy: contractStrategy,
      vaultIndex: data.vaultIndex
    });
    
    // First try to estimate gas to see if the call would succeed
    try {
      const gasEstimate = await contract.registerStrategy.estimateGas(contractStrategy, data.vaultIndex);
      logger.info('Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      logger.error('Gas estimation failed:', gasError);
      return {
        success: false,
        message: `Transaction would fail: The private key (EVM_PRIVATE_KEY) doesn't correspond to the user address ${userAddress}. The contract requires the user to sign their own strategy registration. Please set EVM_PRIVATE_KEY to the private key for address ${userAddress}.`
      };
    }
    
    const tx = await contract.registerStrategy(contractStrategy, data.vaultIndex);
    logger.info('Transaction submitted:', tx.hash);
    
    const receipt = await tx.wait();
    logger.info('Transaction confirmed:', receipt);
    
    return {
      success: true,
      message: 'Strategy registered successfully',
      txHash: receipt.hash || tx.hash,
    };
  } catch (error) {
    logger.error('Error registering strategy on-chain:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a wallet instance for blockchain interactions
 */
async function getWallet(runtime: IAgentRuntime): Promise<ethers.Wallet | null> {
  try {
    const privateKey = process.env.EVM_PRIVATE_KEY;
    if (!privateKey) {
              logger.error('Wallet private key not configured. Please set EVM_PRIVATE_KEY environment variable.');
      return null;
    }
    
    const provider = await getProvider(runtime);
    if (!provider) {
      logger.error('Provider not available');
      return null;
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    
    return wallet;
  } catch (error) {
    logger.error('Error getting wallet:', error);
    return null;
  }
}

export default registerStrategyAction;