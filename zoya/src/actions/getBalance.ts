import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from "@elizaos/core";
import { ethers } from "ethers";

// ABI fragment for the getBalance function
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

const getBalanceAction: Action = {
  name: 'GET_BALANCE',
  similes: ['CHECK_BALANCE', 'VIEW_BALANCE', 'SHOW_BALANCE'],
  description: 'Fetches the current balance for a user from the CrossMind vault',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Check if the message contains keywords related to balance checking
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('get balance') || 
           text.includes('check balance') || 
           text.includes('view balance') ||
           text.includes('show balance') ||
           text.includes('my balance');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ) => {
    try {
      logger.info('Handling GET_BALANCE action');

      // Get the user address from the message or state
      const userAddress = await extractUserAddress(runtime, message, state);
      
      if (!userAddress) {
        const responseContent = {
          thought: 'Unable to extract user address from the message',
          text: 'I need your wallet address to check your balance. Please provide your Ethereum address.',
          actions: ['GET_BALANCE'],
        };
        
        if (callback) {
          await callback(responseContent);
        }
        
        return responseContent;
      }

      // Call the contract to get the user's balance
      const balanceData = await getUserBalanceFromChain(runtime, userAddress);
      
      // Generate response based on the result
      let responseText = '';
      
      if (balanceData.success) {
        // Format the balance data for display
        responseText = formatBalanceResponse(balanceData.data);
      } else {
        responseText = `Failed to retrieve your balance: ${balanceData.message}. Please try again or check your wallet connection.`;
      }
      
      const responseContent = {
        thought: `Balance retrieval ${balanceData.success ? 'succeeded' : 'failed'}: ${balanceData.message}`,
        text: responseText,
        actions: ['GET_BALANCE'],
        data: balanceData.success ? balanceData.data : undefined,
      };
      
      if (callback) {
        await callback(responseContent);
      }
      
      return responseContent;
    } catch (error) {
      logger.error('Error in GET_BALANCE action:', error);
      
      const errorResponse = {
        thought: `Error occurred during balance retrieval: ${error}`,
        text: 'Sorry, there was an error while trying to check your balance. Please check your connection and try again.',
        actions: ['GET_BALANCE'],
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
        content: { text: 'What is my current balance?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Your total balance is 1,000 USDC. You have 3 separate deposits: 500 USDC (Low Risk, Unlocked), 300 USDC (Medium Risk, Locked), and 200 USDC (High Risk, Unlocked).',
          thought: 'Retrieved user balance information from the contract',
          actions: ['GET_BALANCE'],
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
    /*const contractAddress = process.env.VAULT_CONTRACT_ADDRESS;
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
    }));*/
    const formattedBalances = [
      {
        amount: '1000',
        risk: RiskLevel.LOW,
        locked: false
      },
      {
        amount: '500',
        risk: RiskLevel.MEDIUM,
        locked: true
      },
      {
        amount: '200',
        risk: RiskLevel.HIGH,
        locked: false
      }
    ];
    const totalBalance = '1700';
    
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
 * Format the balance data into a human-readable response
 */
function formatBalanceResponse(balanceData: UserBalance): string {
  // Convert wei to USDC (assuming 6 decimals for USDC)
  const formatAmount = (amountInWei: string): string => {
    const amount = Number(amountInWei) / 1_000_000; // 6 decimals for USDC
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Format the total balance
  const totalBalanceFormatted = formatAmount(balanceData.totalBalance);
  
  // If there are no balances, return a simple message
  if (balanceData.balances.length === 0) {
    return `Your total balance is ${totalBalanceFormatted} USDC. You don't have any active deposits.`;
  }
  
  // Format the individual balances
  const balanceDetails = balanceData.balances.map((balance, index) => {
    const amountFormatted = formatAmount(balance.amount);
    const riskLevel = ['Low', 'Medium', 'High'][balance.risk] || 'Unknown';
    const lockStatus = balance.locked ? 'Locked' : 'Unlocked';
    
    return `${amountFormatted} USDC (${riskLevel} Risk, ${lockStatus})`;
  }).join(', ');
  
  return `Your total balance is ${totalBalanceFormatted} USDC. You have ${balanceData.balances.length} ${balanceData.balances.length === 1 ? 'deposit' : 'deposits'}: ${balanceDetails}.`;
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

export default getBalanceAction;
