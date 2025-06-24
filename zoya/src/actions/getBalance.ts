import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from "@elizaos/core";
import { ethers } from "ethers";
import { vaultABI } from "../abis";

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
          text: 'Your total balance is 1,000.00 USDC. You have 3 active deposits: 500.00 USDC (Low Risk, Unlocked), 300.00 USDC (Medium Risk, Locked), and 200.00 USDC (High Risk, Unlocked).',
          thought: 'Retrieved user balance information from the contract',
          actions: ['GET_BALANCE'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'Check my vault balance' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Your total balance is 2,500.00 USDC. You have 2 active deposits: 1,500.00 USDC (Medium Risk, Unlocked) and 1,000.00 USDC (Low Risk, Locked).',
          thought: 'Successfully retrieved balance with multiple deposits',
          actions: ['GET_BALANCE'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'Show me my CrossMind balance' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Your total balance is 0.00 USDC. You don\'t have any active deposits.',
          thought: 'User has no balance in the vault',
          actions: ['GET_BALANCE'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'How much do I have invested?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Your total balance is 750.00 USDC. You have 1 active deposit: 750.00 USDC (High Risk, Unlocked) and 2 empty deposits.',
          thought: 'Retrieved balance showing active and empty deposits',
          actions: ['GET_BALANCE'],
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
    
    // First, check if there's an Ethereum address in the current message
    const addressRegex = /0x[a-fA-F0-9]{40}/;
    const match = text.match(addressRegex);
    
    if (match) {
      // Found address in message - store it in state for future use
      if (state) {
        state.userAddress = match[0];
      }
      logger.info(`Extracted and stored user address: ${match[0]}`);
      return match[0];
    }
    
    // Check if address is stored in current state
    if (state?.userAddress) {
      logger.info(`Retrieved user address from state: ${state.userAddress}`);
      return state.userAddress as string;
    }
    
    // Check if there's a stored user profile or character settings
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
    const provider = new ethers.JsonRpcProvider(process.env.EVM_PROVIDER_URL);
    
    // Create contract instance (read-only since we're just querying)
    const contract = new ethers.Contract(contractAddress, vaultABI, provider);
    
    // Call the getBalance function to get detailed balance info
    const balances = await contract.getBalance(userAddress);
    console.log('Raw balances from contract:', balances);
    
    // Format the balance data - convert from wei to USDC immediately
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
    
    console.log('Formatted balances:', formattedBalances);
    console.log('Total balance:', totalBalance);
    
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
  // Format USDC amounts (amounts are already in USDC, not wei)
  const formatAmount = (amountInUsdc: string): string => {
    const amount = parseFloat(amountInUsdc);
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Format the total balance
  const totalBalanceFormatted = formatAmount(balanceData.totalBalance);
  
  // If there are no balances, return a simple message
  if (balanceData.balances.length === 0) {
    return `Your total balance is ${totalBalanceFormatted} USDC. You don't have any active deposits.`;
  }
  
  // Filter out zero balances and format the individual balances
  const nonZeroBalances = balanceData.balances.filter(balance => parseFloat(balance.amount) > 0);
  
  if (nonZeroBalances.length === 0) {
    return `Your total balance is ${totalBalanceFormatted} USDC. All your deposits are currently zero.`;
  }
  
  const balanceDetails = nonZeroBalances.map((balance, index) => {
    const amountFormatted = formatAmount(balance.amount);
    const riskLevel = ['Low', 'Medium', 'High'][balance.risk] || 'Unknown';
    const lockStatus = balance.locked ? 'Locked' : 'Unlocked';
    
    return `${amountFormatted} USDC (${riskLevel} Risk, ${lockStatus})`;
  }).join(', ');
  
  const zeroBalanceCount = balanceData.balances.length - nonZeroBalances.length;
  const zeroBalanceText = zeroBalanceCount > 0 ? ` and ${zeroBalanceCount} empty ${zeroBalanceCount === 1 ? 'deposit' : 'deposits'}` : '';
  
  return `Your total balance is ${totalBalanceFormatted} USDC. You have ${nonZeroBalances.length} active ${nonZeroBalances.length === 1 ? 'deposit' : 'deposits'}: ${balanceDetails}${zeroBalanceText}.`;
}


export default getBalanceAction;
