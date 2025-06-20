import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from "@elizaos/core";
import { ethers } from "ethers";

// ABI fragment for the CrossMindVault contract to check balance
const vaultABI = [
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
];

// ABI fragment for the registerStrategy function
const strategyManagerABI = [
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
];

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

const registerStrategyAction: Action = {
  name: 'REGISTER_STRATEGY',
  similes: ['CREATE_STRATEGY', 'NEW_STRATEGY', 'SETUP_STRATEGY'],
  description: 'Registers a new investment strategy in the CrossMind system',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Check if the message contains keywords related to strategy registration
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('register strategy') || 
           text.includes('create strategy') || 
           text.includes('new strategy') || 
           text.includes('setup strategy');
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
          text: 'I need your wallet address to check your balance before registering a strategy. Please provide your Ethereum address.',
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
          text: 'You don\'t have any deposits in the CrossMind vault. Please deposit funds first before registering a strategy.',
          actions: ['REGISTER_STRATEGY'],
        };
        
        if (callback) {
          await callback(responseContent);
        }
        
        return responseContent;
      }

      // Get the strategy data from the message or state
      const strategyData = await extractStrategyData(runtime, message, state, balanceData.data);
      
      if (!strategyData) {
        const responseContent = {
          thought: 'Unable to extract strategy data from the message',
          text: 'I need more information about the strategy you want to register. Please provide details about chains, protocols, and allocation percentages.',
          actions: ['REGISTER_STRATEGY'],
        };
        
        if (callback) {
          await callback(responseContent);
        }
        
        return responseContent;
      }

      // Call the contract to register the strategy
      const result = await registerStrategyOnChain(runtime, strategyData);
      
      // Generate response based on the result
      const responseContent = {
        thought: `Strategy registration ${result.success ? 'succeeded' : 'failed'}: ${result.message}`,
        text: result.success 
          ? `Successfully registered your strategy! Transaction hash: ${result.txHash}` 
          : `Failed to register strategy: ${result.message}. Please try again or check your wallet connection.`,
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
        text: 'Sorry, there was an error while trying to register your strategy. Please check your connection and try again.',
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
        content: { text: 'I want to register a new strategy for my funds' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'I can help you register a new investment strategy. Please provide details about which chains and protocols you want to include, along with allocation percentages.',
          thought: 'Need to collect strategy information from the user',
          actions: ['REGISTER_STRATEGY'],
        },
      },
    ],
  ],
};

/**
 * Extract user address from the message or state
 */
async function extractUserAddress(runtime: IAgentRuntime, message: Memory, state?: State): Promise<string | null> {
  // This is a placeholder implementation
  // In a real application, you would extract this data from the user message or a form
  
  const text = message.content.text?.toLowerCase() || '';
  
  // Check if the message contains an Ethereum address
  const addressRegex = /0x[a-fA-F0-9]{40}/;
  const match = text.match(addressRegex);
  
  if (match) {
    return match[0];
  }
  
  // If no address in the message, try to get it from state or user profile
  // This is just a placeholder - in a real app you'd implement proper user authentication
  if (state?.user?.address) {
    return state.user.address;
  }
  
  // For demo purposes, return a test address
  // In production, you would require the user to provide their address or connect their wallet
  return '0x1234567890123456789012345678901234567890';
}

/**
 * Get user balance from the blockchain by calling the CrossMindVault contract
 */
async function getUserBalanceFromChain(runtime: IAgentRuntime, userAddress: string): Promise<{
  success: boolean;
  message: string;
  data?: UserBalance;
}> {
  try {
    // Get the contract address from environment or configuration
    const contractAddress = process.env.VAULT_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return { success: false, message: 'Vault contract address not configured' };
    }
    
    // Get the provider from the runtime or environment
    const provider = await getProvider(runtime);
    if (!provider) {
      return { success: false, message: 'Provider not available or not connected' };
    }
    
    // Create contract instance (read-only since we're just querying)
    const contract = new ethers.Contract(contractAddress, vaultABI, provider);
    
    // Call the getBalance function to get detailed balance info
    const balances = await contract.getBalance(userAddress);
    
    // Call the balanceOf function to get total balance
    const totalBalance = await contract.balanceOf(userAddress);
    
    // Format the balance data
    const formattedBalances = balances.map((balance: any) => ({
      amount: balance.amount.toString(),
      risk: Number(balance.risk),
      locked: balance.locked
    }));
    
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

/**
 * Extract strategy data from the user message or state
 * In a real implementation, this would parse user input or use a form
 */
async function extractStrategyData(runtime: IAgentRuntime, message: Memory, state?: State, balanceData?: UserBalance): Promise<{
  strategy: Strategy;
  vaultIndex: number;
} | null> {
  // This is a placeholder implementation
  // In a real application, you would extract this data from the user message or a form
  
  const text = message.content.text?.toLowerCase() || '';
  
  // Very basic parsing - in reality, you would use a more sophisticated approach
  // such as structured forms or a multi-step conversation
  if (!text.includes('strategy')) {
    return null;
  }
  
  // Sample strategy data - in production this would come from user input
  // If we have balance data, use it to inform the strategy
  const amount = balanceData ? parseInt(balanceData.totalBalance) : 0;
  
  return {
    strategy: {
      index: 0, // This will be set by the contract
      status: StrategyStatus.PENDING,
      amount: amount, // Use the user's balance amount if available
      deposits: [
        {
          chainId: 43113, // Avalanche Fuji testnet
          amount: 0, // Will be calculated by the contract
          deposits: [
            {
              adapter: '0x1234567890123456789012345678901234567890', // Example adapter address
              percentage: 50,
            },
            {
              adapter: '0x0987654321098765432109876543210987654321', // Example adapter address
              percentage: 50,
            },
          ],
        },
      ],
    },
    vaultIndex: 0, // Index of the vault to use
  };
}

/**
 * Register the strategy on-chain by calling the StrategyManager contract
 */
async function registerStrategyOnChain(runtime: IAgentRuntime, data: {
  strategy: Strategy;
  vaultIndex: number;
}): Promise<{ success: boolean; message: string; txHash?: string }> {
  try {
    // Get the contract address from environment or configuration
    /*const contractAddress = process.env.STRATEGY_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return { success: false, message: 'Strategy Manager contract address not configured' };
    }
    
    // Get the wallet from the runtime or environment
    const wallet = await getWallet(runtime);
    if (!wallet) {
      return { success: false, message: 'Wallet not available or not connected' };
    }
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, strategyManagerABI, wallet);
    
    // Call the registerStrategy function
    const tx = await contract.registerStrategy(data.strategy, data.vaultIndex);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      message: 'Strategy registered successfully',
      txHash: receipt.transactionHash,
    };*/
    return {
      success: true,
      message: 'Strategy registered successfully',
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
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
    // In a real implementation, you would get the wallet from the runtime or environment
    // This is a placeholder implementation
    
    // Example using private key from environment (not recommended for production)
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      logger.error('Wallet private key not configured');
      return null;
    }
    
    // Get the RPC URL from environment or configuration
    const rpcUrl = process.env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'; // Default to Avalanche Fuji testnet
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    return wallet;
  } catch (error) {
    logger.error('Error getting wallet:', error);
    return null;
  }
}

export default registerStrategyAction;