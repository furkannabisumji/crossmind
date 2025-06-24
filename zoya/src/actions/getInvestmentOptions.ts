import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from "@elizaos/core";
import { ethers } from "ethers";
import { strategyManagerABI } from "../abis";



/**
 * Interface for chain information
 */
interface Chain {
  chainId: number;
  name: string;
  receiver: string;
  protocols: Protocol[];
}

/**
 * Interface for protocol information
 */
interface Protocol {
  name: string;
  adapter: string;
}

/**
 * Interface for investment options data
 */
interface InvestmentOptions {
  chains: Chain[];
}

// Chain ID to name mapping
const chainNames: { [key: number]: string } = {
  1: "Ethereum Mainnet",
  10: "Optimism",
  56: "BNB Chain",
  137: "Polygon",
  42161: "Arbitrum One",
  43114: "Avalanche C-Chain",
  // Testnets
  5: "Ethereum Goerli",
  80001: "Polygon Mumbai",
  43113: "Avalanche Fuji",
  421613: "Arbitrum Goerli",
  11155111: "Ethereum Sepolia"
};

const getInvestmentOptionsAction: Action = {
  name: 'GET_INVESTMENT_OPTIONS',
  similes: ['CHECK_CHAINS', 'VIEW_ADAPTERS', 'SHOW_PROTOCOLS'],
  description: 'Fetches the available chains and adapters for investment from the CrossMind system',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Check if the message contains keywords related to investment options
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('check chains') || 
           text.includes('view adapters') || 
           text.includes('show protocols') ||
           text.includes('available chains') ||
           text.includes('investment options') ||
           text.includes('available adapters');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ) => {
    try {
      logger.info('Handling GET_INVESTMENT_OPTIONS action');

      // Call the contract to get the available chains and protocols
      const investmentOptions = await getInvestmentOptionsFromChain(runtime);
      
      // Generate response based on the result
      let responseText = '';
      
      if (investmentOptions.success) {
        // Format the investment options data for display
        responseText = formatInvestmentOptionsResponse(investmentOptions.data);
      } else {
        responseText = `Failed to retrieve investment options: ${investmentOptions.message}. Please try again or check your connection.`;
      }
      
      const responseContent = {
        thought: `Investment options retrieval ${investmentOptions.success ? 'succeeded' : 'failed'}: ${investmentOptions.message}`,
        text: responseText,
        actions: ['GET_INVESTMENT_OPTIONS'],
        data: investmentOptions.success ? investmentOptions.data : undefined,
      };
      
      if (callback) {
        await callback(responseContent);
      }
      
      return responseContent;
    } catch (error) {
      logger.error('Error in GET_INVESTMENT_OPTIONS action:', error);
      
      const errorResponse = {
        thought: `Error occurred during investment options retrieval: ${error}`,
        text: 'Sorry, there was an error while trying to check available chains and adapters. Please check your connection and try again.',
        actions: ['GET_INVESTMENT_OPTIONS'],
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
        content: { text: 'What chains and protocols can I invest in?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'CrossMind currently supports investments on: Avalanche (AAVE, Trader Joe), Polygon (QuickSwap, Uniswap), and Arbitrum (GMX, Camelot). Each chain offers different protocols with varying risk levels and yield opportunities.',
          thought: 'Retrieved available chains and protocols from the contract',
          actions: ['GET_INVESTMENT_OPTIONS'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'Show me available adapters' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Available protocol adapters across all supported chains: \n• Avalanche Fuji: AAVE, TraderJoe, USDC\n• Ethereum Sepolia: USDC, Compound\n• Polygon: QuickSwap, Uniswap\n\nEach adapter connects to different DeFi protocols with unique risk/reward profiles.',
          thought: 'Listed all available protocol adapters by chain',
          actions: ['GET_INVESTMENT_OPTIONS'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'Which protocols have the highest yield?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'High-yield protocols available in CrossMind: GMX on Arbitrum (15.8% APY), QuickSwap on Polygon (12.3% APY), and Camelot on Arbitrum (11.4% APY). Remember: higher yields typically come with increased risk.',
          thought: 'Highlighted high-yield investment opportunities with risk disclaimer',
          actions: ['GET_INVESTMENT_OPTIONS'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'What are the safest investment options?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Conservative, low-risk options include: USDC on multiple chains (2.1% APY), AAVE on Avalanche (5.2% APY), and Compound on Ethereum (4.8% APY). These protocols prioritize capital preservation with steady, predictable returns.',
          thought: 'Recommended low-risk investment protocols for conservative users',
          actions: ['GET_INVESTMENT_OPTIONS'],
        },
      },
    ],
  ],
};

/**
 * Get available investment options from the blockchain by calling the StrategyManager contract
 */
async function getInvestmentOptionsFromChain(runtime: IAgentRuntime): Promise<{
  success: boolean;
  message: string;
  data?: InvestmentOptions;
}> {
  try {
    // Get the contract address from environment or configuration
    const contractAddress = process.env.STRATEGY_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return { success: false, message: 'Strategy Manager contract address not configured' };
    }
    
    // Get the provider from the runtime or environment
    const provider = new ethers.JsonRpcProvider(process.env.EVM_PROVIDER_URL);
    
    // Create contract instance (read-only since we're just querying)
    const contract = new ethers.Contract(contractAddress, strategyManagerABI, provider);
    
    // Get all supported chains directly from the contract
    const allChains = await contract.getAllChains();
    const supportedChains: Chain[] = [];
    
    for (const chainId of allChains) {
      try {
        
        
        // Get protocols for this chain using the new function
        const protocols = await contract.getAllProtocolsByChain(chainId);
        
        // Create a new chain object
        const chain: Chain = {
          chainId: chainId,
          name: chainNames[chainId] || `Chain ${chainId}`,
          receiver: '', // We'll get this if needed
          protocols: []
        };
        
        // Get protocol details
        let protocolIndex = 0;
        while (protocolIndex < protocols.length) {
          try {
            const protocol = await contract.chainProtocols(chainId);
            
            // If we got a valid protocol, add it to the list
            if (protocol.name && protocol.adapter !== ethers.ZeroAddress) {
              chain.protocols.push({
                name: protocol.name,
                adapter: protocol.adapter
              });
            }
            
            protocolIndex++;
          } catch (error) {
            // Reached the end of the protocols list or encountered an error
            break;
          }
        }
        
        // Add the chain to the list if it has protocols
        if (chain.protocols.length > 0) {
          supportedChains.push(chain);
        }
      } catch (error) {
        // Skip this chain ID if there was an error
        logger.error(`Error processing chain ${chainId}:`, error);
      }
    }
    logger.info('Supported chains:', supportedChains);
    
    return {
      success: true,
      message: 'Investment options retrieved successfully',
      data: {
        chains: supportedChains
      }
    };
  } catch (error) {
    logger.error('Error getting investment options from chain:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Format the investment options data into a human-readable response
 */
function formatInvestmentOptionsResponse(options: InvestmentOptions): string {
  if (options.chains.length === 0) {
    return "There are currently no supported chains or protocols available for investment in the CrossMind system.";
  }
  
  let response = "CrossMind currently supports investments on the following chains and protocols:\n\n";
  
  options.chains.forEach(chain => {
    response += `• ${chain.name} (Chain ID: ${chain.chainId}):\n`;
    
    if (chain.protocols.length === 0) {
      response += "  - No protocols available on this chain yet\n";
    } else {
      chain.protocols.forEach(protocol => {
        response += `  - ${protocol.name} (${protocol.adapter.slice(0, 6)}...${protocol.adapter.slice(-4)})\n`;
      });
    }
    
    response += "\n";
  });
  
  response += "You can use these options when creating your investment strategy. Each protocol offers different risk levels and yield opportunities.";
  
  return response;
}

/**
 * Get a provider instance for blockchain interactions
 */
async function getProvider(runtime: IAgentRuntime): Promise<ethers.Provider | null> {
  try {
    // Get the RPC URL from environment or configuration
    const rpcUrl = process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'; // Default to Avalanche Fuji testnet
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    return provider;
  } catch (error) {
    logger.error('Error getting provider:', error);
    return null;
  }
}

export default getInvestmentOptionsAction;
