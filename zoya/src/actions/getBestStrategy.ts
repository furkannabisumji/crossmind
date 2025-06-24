import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from "@elizaos/core";
import { ethers } from "ethers";
import { vaultABI, strategyManagerABI } from "../abis";

/**
 * Risk level enumeration
 */
enum RiskLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2
}

/**
 * Balance interface
 */
interface Balance {
  amount: string;
  risk: RiskLevel;
  locked: boolean;
}

/**
 * Protocol interface
 */
interface Protocol {
  name: string;
  adapter: string;
  expectedAPY?: number;
  riskScore?: number;
}

/**
 * Chain interface
 */
interface ChainInfo {
  chainId: number;
  name: string;
  protocols: Protocol[];
  gasEfficiency: number;
  totalLiquidity?: number;
}

/**
 * Strategy recommendation interface
 */
interface StrategyRecommendation {
  recommendedAllocation: Array<{
    chainId: number;
    chainName: string;
    protocols: Array<{
      name: string;
      adapter: string;
      percentage: number;
      expectedAPY: number;
    }>;
    totalPercentage: number;
  }>;
  reasoning: string;
  riskProfile: string;
  totalExpectedAPY: number;
}

/**
 * Complete strategy data interface
 */
interface StrategyData {
  userBalance: {
    totalBalance: string;
    balances: Balance[];
  };
  availableChains: ChainInfo[];
  recommendation: StrategyRecommendation;
}

// Chain ID to name mapping with additional data
const chainData: { [key: number]: { name: string; gasEfficiency: number; } } = {
  1: { name: "Ethereum Mainnet", gasEfficiency: 3 },
  10: { name: "Optimism", gasEfficiency: 8 },
  56: { name: "BNB Chain", gasEfficiency: 7 },
  137: { name: "Polygon", gasEfficiency: 9 },
  42161: { name: "Arbitrum One", gasEfficiency: 8 },
  43114: { name: "Avalanche C-Chain", gasEfficiency: 8 },
  // Testnets
  5: { name: "Ethereum Goerli", gasEfficiency: 3 },
  80001: { name: "Polygon Mumbai", gasEfficiency: 9 },
  43113: { name: "Avalanche Fuji", gasEfficiency: 8 },
  421613: { name: "Arbitrum Goerli", gasEfficiency: 8 },
  11155111: { name: "Ethereum Sepolia", gasEfficiency: 3 }
};

// Protocol risk and APY data (mock data for strategy decisions)
const protocolData: { [key: string]: { expectedAPY: number; riskScore: number; } } = {
  'AAVE': { expectedAPY: 5.2, riskScore: 3 },
  'Compound': { expectedAPY: 4.8, riskScore: 3 },
  'Uniswap': { expectedAPY: 8.5, riskScore: 6 },
  'QuickSwap': { expectedAPY: 12.3, riskScore: 7 },
  'TraderJoe': { expectedAPY: 9.2, riskScore: 6 },
  'GMX': { expectedAPY: 15.8, riskScore: 8 },
  'Camelot': { expectedAPY: 11.4, riskScore: 7 },
  'USDC': { expectedAPY: 2.1, riskScore: 1 }
};

const getBestStrategyAction: Action = {
  name: 'GET_BEST_STRATEGY',
  similes: ['RECOMMEND_STRATEGY', 'BEST_INVESTMENT', 'OPTIMIZE_PORTFOLIO'],
  description: 'Recommends best investment strategy based on balance and available chains',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('best strategy') || text.includes('recommend');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ) => {
    const response = {
      thought: 'Generated investment strategy recommendation',
      text: 'Based on your portfolio analysis, I recommend a diversified strategy across multiple chains.',
      actions: ['GET_BEST_STRATEGY'],
    };
    
    if (callback) await callback(response);
    return response;
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: { text: 'What is the best investment strategy for me?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Based on your 1,000 USDC balance and current market conditions, I recommend a diversified strategy: 40% in Avalanche AAVE (low risk, 5.2% APY), 35% in Polygon QuickSwap (medium risk, 12.3% APY), and 25% in Arbitrum GMX (high risk, 15.8% APY). This balanced approach targets 9.8% expected APY while managing risk across multiple chains.',
          thought: 'Analyzed user balance and available protocols to generate optimized investment strategy',
          actions: ['GET_BEST_STRATEGY'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'Recommend an optimal portfolio allocation' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'For your 2,500 USDC portfolio, I suggest a conservative approach: 60% Avalanche AAVE (5.2% APY), 30% Polygon USDC (2.1% APY), and 10% Arbitrum Camelot (11.4% APY). This strategy prioritizes capital preservation while achieving 5.1% expected APY.',
          thought: 'Generated conservative strategy recommendation based on user balance',
          actions: ['GET_BEST_STRATEGY'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'What\'s the most profitable strategy?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'For maximum yield with your 5,000 USDC, I recommend an aggressive strategy: 50% Arbitrum GMX (15.8% APY), 30% Polygon QuickSwap (12.3% APY), and 20% Avalanche TraderJoe (9.2% APY). Expected APY: 13.1%. Note: Higher returns come with increased risk.',
          thought: 'Provided high-yield strategy with appropriate risk warnings',
          actions: ['GET_BEST_STRATEGY'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'Optimize my current investment strategy' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Analyzing your current medium-risk profile with 1,200 USDC, I recommend rebalancing to: 45% Polygon QuickSwap (12.3% APY), 35% Avalanche AAVE (5.2% APY), and 20% Arbitrum Camelot (11.4% APY). This optimizes for 9.7% APY with balanced risk distribution.',
          thought: 'Optimized existing strategy based on current risk profile',
          actions: ['GET_BEST_STRATEGY'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'Suggest a gas-efficient investment strategy' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'For gas efficiency with your 800 USDC, I recommend concentrating on Polygon: 70% QuickSwap (12.3% APY) and 30% USDC (2.1% APY). Polygon offers excellent gas efficiency (9/10) while targeting 9.2% APY. Single-chain strategy minimizes transaction costs.',
          thought: 'Focused on gas efficiency while maintaining competitive returns',
          actions: ['GET_BEST_STRATEGY'],
        },
      },
    ],
  ],
};

/**
 * Extract user address from the message or state with persistent memory
 */
async function extractUserAddress(runtime: IAgentRuntime, message: Memory, state?: State): Promise<string | null> {
  try {
    const text = message.content.text || '';
    
    // Look for Ethereum address pattern (0x followed by 40 hex characters)
    const addressRegex = /0x[a-fA-F0-9]{40}/;
    const addressMatch = text.match(addressRegex);
    
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
 * Get user balance from the CrossMindVault contract
 */
async function getUserBalanceFromChain(runtime: IAgentRuntime, userAddress: string): Promise<{
  success: boolean;
  message: string;
  data?: { totalBalance: string; balances: Balance[]; };
}> {
  try {
    const contractAddress = process.env.VAULT_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return { success: false, message: 'Vault contract address not configured' };
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.EVM_PROVIDER_URL);
    const contract = new ethers.Contract(contractAddress, vaultABI, provider);
    
    const balances = await contract.getBalance(userAddress);
    console.log('Raw balances from contract (getBestStrategy):', balances);
    
    // Convert from wei to USDC immediately
    const formattedBalances = balances.map((balance: any) => {
      // Convert from wei to USDC (6 decimals)
      const amountInUsdc = ethers.formatUnits(balance.amount, 6);
      
      return {
        amount: amountInUsdc, // Store as USDC string, not wei
        risk: Number(balance.risk),
        locked: balance.locked
      };
    });
    
    // Calculate total balance correctly (sum of USDC amounts)
    const totalBalance = formattedBalances.reduce((total: number, balance: any) => {
      return total + parseFloat(balance.amount);
    }, 0);
    
    console.log('Formatted balances (getBestStrategy):', formattedBalances);
    console.log('Total balance (getBestStrategy):', totalBalance);
    
    return {
      success: true,
      message: 'Balance retrieved successfully',
      data: {
        balances: formattedBalances,
        totalBalance: totalBalance.toString()
      }
    };
  } catch (error) {
    logger.error('Error getting balance from chain:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get available chains and protocols from StrategyManager contract
 */
async function getAvailableChainsFromContract(runtime: IAgentRuntime): Promise<{
  success: boolean;
  message: string;
  data?: ChainInfo[];
}> {
  try {
    const contractAddress = process.env.STRATEGY_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return { success: false, message: 'Strategy Manager contract address not configured' };
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.EVM_PROVIDER_URL);
    const contract = new ethers.Contract(contractAddress, strategyManagerABI, provider);
    
    // Get all supported chains
    const allChains = await contract.getAllChains();
    const chainInfos: ChainInfo[] = [];
    
    for (const chainId of allChains) {
      const chainIdNumber = Number(chainId);
      const protocols = await contract.getAllProtocolsByChain(chainIdNumber);
      
      // Get protocol details
      const protocolDetails: Protocol[] = [];
      let protocolIndex = 0;
      
      while (protocolIndex < protocols.length) {
        try {
          const protocolInfo = await contract.chainProtocols(chainIdNumber, protocolIndex);
          if (protocolInfo.name && protocolInfo.adapter !== ethers.ZeroAddress) {
            const protocolName = protocolInfo.name;
            const protocolRiskData = protocolData[protocolName] || { expectedAPY: 5.0, riskScore: 5 };
            
            protocolDetails.push({
              name: protocolName,
              adapter: protocolInfo.adapter,
              expectedAPY: protocolRiskData.expectedAPY,
              riskScore: protocolRiskData.riskScore
            });
          }
          protocolIndex++;
        } catch (error) {
          break;
        }
      }
      
      if (protocolDetails.length > 0) {
        const chainInfo = chainData[chainIdNumber] || { name: `Chain ${chainIdNumber}`, gasEfficiency: 5 };
        
        chainInfos.push({
          chainId: chainIdNumber,
          name: chainInfo.name,
          protocols: protocolDetails,
          gasEfficiency: chainInfo.gasEfficiency
        });
      }
    }
    
    return {
      success: true,
      message: 'Available chains retrieved successfully',
      data: chainInfos
    };
  } catch (error) {
    logger.error('Error getting available chains:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate investment strategy recommendation based on user balance and available options
 */
function generateStrategyRecommendation(
  userBalance: { totalBalance: string; balances: Balance[]; },
  availableChains: ChainInfo[]
): StrategyRecommendation {
  const totalBalanceNum = Number(userBalance.totalBalance);
  const unlockedBalance = userBalance.balances
    .filter(b => !b.locked)
    .reduce((sum, b) => sum + Number(b.amount), 0);
  
  // Determine risk profile based on existing balances
  const avgRisk = userBalance.balances.length > 0 
    ? userBalance.balances.reduce((sum, b) => sum + b.risk, 0) / userBalance.balances.length
    : 1; // Default to medium risk
  
  let riskProfile = 'Medium Risk';
  if (avgRisk < 0.7) riskProfile = 'Conservative';
  else if (avgRisk > 1.3) riskProfile = 'Aggressive';
  
  // Select best protocols based on risk profile and expected returns
  const allProtocols = availableChains.flatMap(chain => 
    chain.protocols.map(protocol => ({
      ...protocol,
      chainId: chain.chainId,
      chainName: chain.name,
      gasEfficiency: chain.gasEfficiency
    }))
  );
  
  // Sort protocols by a composite score (APY, risk fit, gas efficiency)
  const scoredProtocols = allProtocols.map(protocol => {
    const riskFitScore = 10 - Math.abs((protocol.riskScore || 5) - (avgRisk * 5));
    const apyScore = (protocol.expectedAPY || 5) / 2;
    const gasScore = protocol.gasEfficiency;
    const compositeScore = (apyScore * 0.4) + (riskFitScore * 0.3) + (gasScore * 0.3);
    
    return { ...protocol, score: compositeScore };
  }).sort((a, b) => b.score - a.score);
  
  // Create allocation strategy (top 3-4 protocols)
  const selectedProtocols = scoredProtocols.slice(0, Math.min(4, scoredProtocols.length));
  const totalScore = selectedProtocols.reduce((sum, p) => sum + p.score, 0);
  
  // Group by chain and calculate percentages
  const chainAllocations: { [chainId: number]: any } = {};
  let totalExpectedAPY = 0;
  
  selectedProtocols.forEach(protocol => {
    const percentage = Math.round((protocol.score / totalScore) * 100);
    totalExpectedAPY += (protocol.expectedAPY || 5) * (percentage / 100);
    
    if (!chainAllocations[protocol.chainId]) {
      chainAllocations[protocol.chainId] = {
        chainId: protocol.chainId,
        chainName: protocol.chainName,
        protocols: [],
        totalPercentage: 0
      };
    }
    
    chainAllocations[protocol.chainId].protocols.push({
      name: protocol.name,
      adapter: protocol.adapter,
      percentage,
      expectedAPY: protocol.expectedAPY || 5
    });
    
    chainAllocations[protocol.chainId].totalPercentage += percentage;
  });
  
  // Ensure total adds up to 100%
  const allocations = Object.values(chainAllocations);
  const totalPercentage = allocations.reduce((sum: number, alloc: any) => sum + alloc.totalPercentage, 0);
  if (totalPercentage !== 100) {
    const diff = 100 - totalPercentage;
    if (allocations.length > 0) {
      (allocations[0] as any).totalPercentage += diff;
      (allocations[0] as any).protocols[0].percentage += diff;
    }
  }
  
  // Generate reasoning
  const reasoning = generateReasoning(userBalance, selectedProtocols, riskProfile, totalExpectedAPY);
  
  return {
    recommendedAllocation: allocations as any,
    reasoning,
    riskProfile,
    totalExpectedAPY: Number(totalExpectedAPY.toFixed(2))
  };
}

/**
 * Generate human-readable reasoning for the strategy
 */
function generateReasoning(
  userBalance: { totalBalance: string; balances: Balance[]; },
  selectedProtocols: any[],
  riskProfile: string,
  expectedAPY: number
): string {
  const balanceFormatted = Number(userBalance.totalBalance).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  const protocolNames = selectedProtocols.map(p => p.name).join(', ');
  const chainNames = [...new Set(selectedProtocols.map(p => p.chainName))].join(', ');
  
  return `Based on your ${balanceFormatted} USDC balance and ${riskProfile.toLowerCase()} profile, I recommend diversifying across ${chainNames} using ${protocolNames}. This strategy targets ${expectedAPY.toFixed(1)}% APY while maintaining appropriate risk distribution and gas efficiency across multiple chains.`;
}

/**
 * Format the complete strategy response for the user
 */
function formatStrategyResponse(data: StrategyData): string {
  const totalBalanceFormatted = Number(data.userBalance.totalBalance).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  let response = `## Investment Strategy Recommendation\n\n`;
  response += `**Your Balance:** ${totalBalanceFormatted} USDC\n`;
  response += `**Risk Profile:** ${data.recommendation.riskProfile}\n`;
  response += `**Expected APY:** ${data.recommendation.totalExpectedAPY}%\n\n`;
  
  response += `### Recommended Allocation:\n\n`;
  
  data.recommendation.recommendedAllocation.forEach(allocation => {
    response += `**${allocation.chainName}** (${allocation.totalPercentage}%):\n`;
    allocation.protocols.forEach(protocol => {
      response += `  • ${protocol.name}: ${protocol.percentage}% (${protocol.expectedAPY}% APY)\n`;
    });
    response += `\n`;
  });
  
  response += `### Strategy Reasoning:\n${data.recommendation.reasoning}\n\n`;
  
  response += `### Available Chains & Protocols:\n`;
  data.availableChains.forEach(chain => {
    response += `• **${chain.name}**: ${chain.protocols.map(p => p.name).join(', ')}\n`;
  });
  
  return response;
}

export default getBestStrategyAction; 