import { RiskProfile } from '../generated/prisma';
import { AgentPromptInput, AgentStrategyOutput } from '../types';
import { riskProfiles } from '../config';
import { bedrockClient } from '../clients/bedrock';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

/**
 * Generate a strategy using AWS Bedrock LLM
 * @param promptInput The input data for the AI agent
 * @returns Promise with the generated strategy
 */
export const generateStrategy = async (
  promptInput: AgentPromptInput
): Promise<AgentStrategyOutput> => {
  try {
    const { objective, walletBalance, marketData, riskProfile, history } = promptInput;
    
    // In production, use AWS Bedrock
    if (process.env.NODE_ENV === 'production' && process.env.AWS_BEDROCK_ENABLED === 'true') {
      return await callBedrockAgent(promptInput);
    }
    
    // For development/testing, return a mock strategy
    const mockStrategy = generateMockStrategy(walletBalance, riskProfile, marketData);
    return mockStrategy;
  } catch (error) {
    console.error('Error generating strategy with AI agent:', error);
    throw new Error('Failed to generate investment strategy');
  }
};

/**
 * Call AWS Bedrock API to generate investment strategy
 * @param promptInput The input data for the AI agent
 * @returns Promise with the generated strategy from Bedrock
 */
async function callBedrockAgent(promptInput: AgentPromptInput): Promise<AgentStrategyOutput> {
  try {
    
    // Format the prompt for Claude model
    const prompt = formatPromptForBedrock(promptInput);
    
    // Call Bedrock with Claude model
    const modelId = 'anthropic.claude-3-sonnet-20240229-v1:0'; // Use Claude 3 Sonnet
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 4096,
          temperature: 0.2,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      })
    );
    
    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Bedrock response');
    }
    
    // Parse the JSON strategy
    const strategyJson = JSON.parse(jsonMatch[1]);
    return strategyJson as AgentStrategyOutput;
  } catch (error) {
    console.error('Error calling Bedrock:', error);
    throw new Error('Failed to generate strategy with AWS Bedrock');
  }
}

/**
 * Format the prompt for Bedrock Claude model
 * @param promptInput The input data for the AI agent
 * @returns Formatted prompt string
 */
function formatPromptForBedrock(promptInput: AgentPromptInput): string {
  const { objective, walletBalance, marketData, riskProfile, history } = promptInput;
  
  const historySection = history ? `Historical Performance:\n${JSON.stringify(history, null, 2)}` : '';
  
  return `You are CrossMind AI, an expert DeFi investment advisor.
  Create an optimal investment strategy based on the following information:

User Objective:
${objective}

Available Balance:
$${walletBalance} USDC

Risk Profile:
${riskProfile}

Current Market Data:
${JSON.stringify(marketData, null, 2)}

${historySection}

Based on this information, create an investment strategy that optimizes for the user's objective while respecting their risk profile.

Provide your response in the following JSON format:

\`\`\`json
{
  "name": "Strategy name",
  "description": "Brief strategy description",
  "allocations": [
    {
      "protocol": "Protocol name",
      "chain": "ETHEREUM or POLYGON or ARBITRUM or OPTIMISM",
      "asset": "Asset symbol",
      "percentage": 25,
      "amount": 250,
      "reason": "Reason for this allocation"
    }
  ],
  "actions": [
    "Action 1 description",
    "Action 2 description"
  ],
  "reasoning": "Detailed reasoning for the overall strategy"
}
\`\`\`

Ensure all allocations add up to 100% and the total amount matches the available balance. Provide clear actions that can be executed by a DeFi protocol integration.`;
}

/**
 * Generate a mock strategy for development purposes
 * @param walletBalance The user's wallet balance
 * @param riskProfile The user's risk profile
 * @param marketData Market data for different protocols
 * @returns A mock strategy output
 */
const generateMockStrategy = (
  walletBalance: number,
  riskProfile: RiskProfile,
  marketData: Record<string, any>
): AgentStrategyOutput => {
  // Get risk profile settings
  const profileSettings = riskProfiles[riskProfile.toLowerCase() as keyof typeof riskProfiles];
  
  // Sort protocols by APY (descending)
  const sortedProtocols = Object.entries(marketData)
    .filter(([key]) => key.includes('APY'))
    .sort(([, a], [, b]) => Number(b) - Number(a));
  
  // Generate allocation based on risk profile
  const strategy: Record<string, any> = {};
  const actions: string[] = [];
  let remainingBalance = walletBalance;
  let allocatedPercentage = 0;
  
  // Allocate to top protocols based on risk profile
  for (const [key, apy] of sortedProtocols) {
    if (allocatedPercentage >= 0.8) break; // Keep some in reserve
    
    const protocolName = key.replace('APY', '');
    const chainName = protocolName.split('_')[0];
    const protocolType = protocolName.split('_')[1] || 'stake';
    
    // Calculate allocation percentage based on risk profile
    let allocationPercentage = Math.min(
      profileSettings.maxAllocationPerProtocol,
      (1 - allocatedPercentage)
    );
    
    // Reduce allocation for lower APYs
    if (Number(apy) < 10) {
      allocationPercentage *= 0.8;
    }
    
    const allocationAmount = walletBalance * allocationPercentage;
    
    strategy[protocolName] = allocationAmount;
    actions.push(`bridge ${allocationAmount.toFixed(2)} to ${chainName}`);
    actions.push(`${protocolType} into protocol ${protocolName}`);
    
    remainingBalance -= allocationAmount;
    allocatedPercentage += allocationPercentage;
  }
  
  // Add reserve amount
  strategy.reserve = remainingBalance;
  
  // Add monitoring action
  actions.push('track APRs daily');
  
  return {
    strategy,
    actions,
    reasoning: `Strategy optimized for ${riskProfile} risk profile, focusing on highest yield opportunities while maintaining diversification across chains and protocols.`,
  };
};

/**
 * Analyze market conditions and recommend rebalancing
 * @param strategyId The ID of the strategy to analyze
 * @param currentAllocations Current asset allocations
 * @param marketData Current market data
 * @param riskProfile User's risk profile
 * @returns Promise with rebalancing recommendations
 */
export const analyzeAndRebalance = async (
  strategyId: string,
  currentAllocations: Record<string, any>[],
  marketData: Record<string, any>,
  riskProfile: RiskProfile
): Promise<AgentStrategyOutput> => {
  try {
    // TODO: Implement actual market analysis and rebalancing logic
    // This would typically use the AWS Bedrock to analyze market conditions
    
    // For now, return a mock rebalancing strategy
    const totalValue = currentAllocations.reduce(
      (sum, allocation) => sum + (allocation.currentAmount || 0),
      0
    );
    
    return generateMockStrategy(totalValue, riskProfile, marketData);
  } catch (error) {
    console.error('Error analyzing market conditions:', error);
    throw new Error('Failed to analyze market conditions and generate rebalancing strategy');
  }
};
