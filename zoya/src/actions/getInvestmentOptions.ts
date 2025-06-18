import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from "@elizaos/core";
import { ethers } from "ethers";

// ABI fragment for the StrategyManager contract to get available chains and protocols
const strategyManagerABI = [
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
        "name": "",
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
      },
      {
        "internalType": "address",
        "name": "adapter",
        "type": "address"
      }
    ],
    "name": "isProtocol",
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
  }
];

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
    const provider = await getProvider(runtime);
    if (!provider) {
      return { success: false, message: 'Provider not available or not connected' };
    }
    
    // Create contract instance (read-only since we're just querying)
    const contract = new ethers.Contract(contractAddress, strategyManagerABI, provider);
    
    // Get supported chains (this is a simplified approach - in a real implementation, 
    // you would need to query for all possible chain IDs or have a predefined list)
    const supportedChains: Chain[] = [];
    
    // List of common chain IDs to check
    const chainIdsToCheck = [
      1, 10, 56, 137, 42161, 43114, // Mainnets
      5, 80001, 43113, 421613, 11155111 // Testnets
    ];
    
    for (const chainId of chainIdsToCheck) {
      try {
        // Check if the chain is supported
        const isSupported = await contract.isSupportedChainId(chainId);
        
        if (isSupported) {
          // Get the chain receiver address
          const chainData = await contract.chains(chainId);
          
          // Create a new chain object
          const chain: Chain = {
            chainId,
            name: chainNames[chainId] || `Chain ${chainId}`,
            receiver: chainData.receiver,
            protocols: []
          };
          
          // Get protocols for this chain (simplified approach)
          // In a real implementation, you would need to know how many protocols are available
          // or use events to get this information
          let protocolIndex = 0;
          while (true) {
            try {
              const protocol = await contract.chainProtocols(chainId, protocolIndex);
              
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
        }
      } catch (error) {
        // Skip this chain ID if there was an error
        logger.error(`Error checking chain ${chainId}:`, error);
      }
    }
    
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
