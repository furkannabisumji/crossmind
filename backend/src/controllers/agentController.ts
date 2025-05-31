import { Request, Response } from 'express';
import prisma from '../clients/prisma';
import { analyzeAndRebalance } from '../utils/agentUtils';
import { fetchProtocolApy, interactWithProtocol, bridgeTokens } from '../utils/blockchainUtils';
import { setupChainlinkAutomation } from '../utils/chainlinkUtils';

/**
 * @desc    Execute agent decision
 * @route   POST /api/agent/execute/:decisionId
 * @access  Private
 */
export const executeAgentDecision = async (req: Request, res: Response) => {
  try {
    const { decisionId } = req.params;

    // Find the decision
    const decision = await prisma.agentDecision.findUnique({
      where: { id: decisionId },
      include: {
        strategy: {
          include: {
            allocations: true,
          },
        },
      },
    });

    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    // Check if the decision belongs to the user
    if (decision.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to execute this decision' });
    }

    // Check if the decision is already executed
    if (decision.status === 'EXECUTED') {
      return res.status(400).json({ message: 'Decision already executed' });
    }

    // Parse the action string to get individual actions
    const actions = decision.action.split(', ');
    const transactions = [];

    // Execute each action
    for (const action of actions) {
      if (action.includes('bridge')) {
        // Handle bridge action
        const match = action.match(/bridge (\d+\.?\d*) to (\w+)/);
        if (match) {
          const amount = parseFloat(match[1]);
          const chain = match[2].toUpperCase();
          
          // Execute bridge transaction
          const txHash = await bridgeTokens(
            'ETHEREUM', // Assuming starting from Ethereum
            chain as any,
            'USDC',
            amount,
            req.user.walletAddress
          );
          
          // Record transaction
          const transaction = await prisma.transaction.create({
            data: {
              userId: req.user.id,
              strategyId: decision.strategyId,
              agentDecisionId: decision.id,
              transactionType: 'BRIDGE',
              chain: chain as any,
              asset: 'USDC',
              amount,
              txHash,
              status: 'PENDING',
            },
          });
          
          transactions.push(transaction);
        }
      } else if (action.includes('stake') || action.includes('lend') || action.includes('provide')) {
        // Handle protocol interaction action
        const parts = action.split(' ');
        const actionType = parts[0]; // stake, lend, provide
        const protocol = parts[parts.length - 1];
        
        // Find matching allocation
        const allocation = decision.strategy.allocations.find(
          (a: any) => a.protocol.toLowerCase() === protocol.toLowerCase()
        );
        
        if (allocation) {
          // Execute protocol interaction
          const txHash = await interactWithProtocol(
            allocation.chain,
            allocation.protocol,
            actionType,
            allocation.asset,
            allocation.targetAmount || 0,
            req.user.walletAddress
          );
          
          // Record transaction
          const transaction = await prisma.transaction.create({
            data: {
              userId: req.user.id,
              strategyId: decision.strategyId,
              agentDecisionId: decision.id,
              transactionType: actionType.toUpperCase() as any,
              chain: allocation.chain,
              protocol: allocation.protocol,
              asset: allocation.asset,
              amount: allocation.targetAmount || 0,
              txHash,
              status: 'PENDING',
            },
          });
          
          transactions.push(transaction);
        }
      }
    }

    // Update decision status
    const updatedDecision = await prisma.agentDecision.update({
      where: { id: decisionId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
      },
    });
    
    return res.status(200).json({
      success: true,
      message: 'Decision executed successfully',
      data: {
        decision: updatedDecision,
        transactions
      }
    });
  } catch (error: any) {
    console.error('Error in executeAgentDecision:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute agent decision'
    });
  }
};

/**
 * @desc    Generate a rebalancing recommendation
 * @route   POST /api/agent/rebalance/:strategyId
 * @access  Private
 */
export const generateRebalance = async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;

    // Find the strategy
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      include: {
        allocations: true,
      },
    });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    // Check if the strategy belongs to the user
    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to rebalance this strategy' });
    }

    // Fetch current market data
    const marketData: Record<string, any> = {};
    
    // Fetch APYs for each allocation
    for (const allocation of strategy.allocations) {
      const key = `${allocation.chain.toLowerCase()}${allocation.protocol}APY`;
      marketData[key] = await fetchProtocolApy(
        allocation.chain,
        allocation.protocol,
        allocation.asset
      );
    }

    // Add some additional market data for potential new allocations
    marketData.avalancheStakingAPY = await fetchProtocolApy('AVALANCHE', 'staking', 'AVAX');
    marketData.baseStakingAPY = await fetchProtocolApy('BASE', 'staking', 'ETH');
    marketData.polygonLpAPY = await fetchProtocolApy('POLYGON', 'liquidity', 'MATIC-USDC');

    // Generate rebalancing strategy
    const rebalanceStrategy = await analyzeAndRebalance(
      strategyId,
      strategy.allocations,
      marketData,
      strategy.riskProfile
    );

    // Create agent decision record
    const decision = await prisma.agentDecision.create({
      data: {
        userId: req.user.id,
        strategyId,
        decisionType: 'REBALANCE',
        reasoning: rebalanceStrategy.reasoning,
        marketData,
        action: rebalanceStrategy.actions.join(', '),
        status: 'PENDING',
      },
    });

    res.json({
      message: 'Rebalance recommendation generated',
      decision,
      rebalanceStrategy,
    });
  } catch (error) {
    console.error('Error in generateRebalance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Set up Chainlink Automation for a strategy
 * @route   POST /api/agent/automate/:strategyId
 * @access  Private
 */
export const setupAutomation = async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;
    const { interval } = req.body; // Interval in seconds

    // Find the strategy
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    // Check if the strategy belongs to the user
    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to automate this strategy' });
    }

    // Set up Chainlink Automation
    const automationId = await setupChainlinkAutomation(
      strategyId,
      'ETHEREUM', // Assuming automation is set up on Ethereum
      interval || 86400 // Default to daily (24 hours)
    );

    // Create agent decision record for automation setup
    const decision = await prisma.agentDecision.create({
      data: {
        userId: req.user.id,
        strategyId,
        decisionType: 'REBALANCE',
        reasoning: 'Setting up automated rebalancing via Chainlink Automation',
        marketData: { automationInterval: interval || 86400 },
        action: `Set up Chainlink Automation with ID ${automationId}`,
        status: 'EXECUTED',
        executedAt: new Date(),
      },
    });

    res.json({
      message: 'Chainlink Automation set up successfully',
      automationId,
      decision,
    });
  } catch (error) {
    console.error('Error in setupAutomation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get agent decisions for a strategy
 * @route   GET /api/agent/decisions/:strategyId
 * @access  Private
 */
export const getAgentDecisions = async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;

    // Find the strategy
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    // Check if the strategy belongs to the user
    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view decisions for this strategy' });
    }

    // Get agent decisions for the strategy
    const decisions = await prisma.agentDecision.findMany({
      where: { strategyId },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: true,
      },
    });

    res.json(decisions);
  } catch (error) {
    console.error('Error in getAgentDecisions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
