import { Request, Response } from 'express';
import { Chain } from '../generated/prisma';
import prisma from '../clients/prisma';
import { StrategyInput, AllocationInput } from '../types';
import { generateStrategy } from '../utils/agentUtils';
import { fetchProtocolApy } from '../utils/blockchainUtils';

/**
 * @desc    Create a new investment strategy
 * @route   POST /api/strategies
 * @access  Private
 */
export const createStrategy = async (req: Request, res: Response) => {
  try {
    const { name, description, objective, riskProfile }: StrategyInput = req.body;
    const allocations: AllocationInput[] = req.body.allocations || [];

    // Create strategy
    const strategy = await prisma.strategy.create({
      data: {
        name,
        description,
        objective,
        riskProfile,
        userId: req.user.id,
      },
    });

    // Create allocations if provided
    if (allocations.length > 0) {
      const allocationPromises = allocations.map((allocation) =>
        prisma.allocation.create({
          data: {
            strategyId: strategy.id,
            chain: allocation.chain,
            protocol: allocation.protocol,
            asset: allocation.asset,
            percentage: allocation.percentage,
            targetAmount: allocation.targetAmount,
            apy: allocation.apy,
          },
        })
      );

      await Promise.all(allocationPromises);
    }

    // Fetch the complete strategy with allocations
    const completeStrategy = await prisma.strategy.findUnique({
      where: { id: strategy.id },
      include: { allocations: true },
    });

    res.status(201).json(completeStrategy);
  } catch (error) {
    console.error('Error in createStrategy:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all strategies for a user
 * @route   GET /api/strategies
 * @access  Private
 */
export const getStrategies = async (req: Request, res: Response) => {
  try {
    const strategies = await prisma.strategy.findMany({
      where: { userId: req.user.id },
      include: { allocations: true },
    });

    res.json(strategies);
  } catch (error) {
    console.error('Error in getStrategies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get a strategy by ID
 * @route   GET /api/strategies/:id
 * @access  Private
 */
export const getStrategyById = async (req: Request, res: Response) => {
  try {
    const strategy = await prisma.strategy.findUnique({
      where: { id: req.params.id },
      include: {
        allocations: true,
        agentDecisions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    // Check if the strategy belongs to the user
    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this strategy' });
    }

    res.json(strategy);
  } catch (error) {
    console.error('Error in getStrategyById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update a strategy
 * @route   PUT /api/strategies/:id
 * @access  Private
 */
export const updateStrategy = async (req: Request, res: Response) => {
  try {
    const { name, description, objective, riskProfile, active }: Partial<StrategyInput> & { active?: boolean } = req.body;

    // Check if strategy exists and belongs to user
    const strategy = await prisma.strategy.findUnique({
      where: { id: req.params.id },
    });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this strategy' });
    }

    // Update strategy
    const updatedStrategy = await prisma.strategy.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        objective,
        riskProfile,
        active,
      },
      include: { allocations: true },
    });

    res.json(updatedStrategy);
  } catch (error) {
    console.error('Error in updateStrategy:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete a strategy
 * @route   DELETE /api/strategies/:id
 * @access  Private
 */
export const deleteStrategy = async (req: Request, res: Response) => {
  try {
    // Check if strategy exists and belongs to user
    const strategy = await prisma.strategy.findUnique({
      where: { id: req.params.id },
    });

    if (!strategy) {
      return res.status(404).json({ message: 'Strategy not found' });
    }

    if (strategy.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this strategy' });
    }

    // Delete strategy (this will cascade delete allocations)
    await prisma.strategy.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Strategy deleted successfully' });
  } catch (error) {
    console.error('Error in deleteStrategy:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Generate a strategy using AI agent
 * @route   POST /api/strategies/generate
 * @access  Private
 */
export const generateAiStrategy = async (req: Request, res: Response) => {
  try {
    const { objective, walletBalance, riskProfile } = req.body;

    // Fetch market data (APYs for different protocols)
    const marketData: Record<string, any> = {
      avalancheStakingAPY: await fetchProtocolApy('AVALANCHE', 'staking', 'AVAX'),
      ethereumStakingAPY: await fetchProtocolApy('ETHEREUM', 'staking', 'ETH'),
      baseStakingAPY: await fetchProtocolApy('BASE', 'staking', 'ETH'),
      arbitrumLendingAPY: await fetchProtocolApy('ARBITRUM', 'lending', 'USDC'),
      avalancheLendingAPY: await fetchProtocolApy('AVALANCHE', 'lending', 'USDC'),
      polygonLpAPY: await fetchProtocolApy('POLYGON', 'liquidity', 'MATIC-USDC'),
    };

    // Generate strategy using AI agent
    const generatedStrategy = await generateStrategy({
      objective,
      walletBalance,
      marketData,
      riskProfile,
    });

    // Create strategy in database
    const strategy = await prisma.strategy.create({
      data: {
        name: `${riskProfile} ${objective} Strategy`,
        description: generatedStrategy.reasoning,
        objective,
        riskProfile,
        userId: req.user.id,
      },
    });

    // Create allocations based on generated strategy
    const allocations = [];
    for (const [key, amount] of Object.entries(generatedStrategy.strategy)) {
      if (key === 'reserve') continue; // Skip reserve amount

      const [chain, protocol] = key.split('_');
      
      if (!chain || !amount) continue;

      // Convert chain string to Chain enum
      let chainEnum: Chain;
      switch(chain.toUpperCase()) {
        case 'ETHEREUM':
          chainEnum = Chain.ETHEREUM;
          break;
        case 'AVALANCHE':
          chainEnum = Chain.AVALANCHE;
          break;
        case 'BASE':
          chainEnum = Chain.BASE;
          break;
        case 'ARBITRUM':
          chainEnum = Chain.ARBITRUM;
          break;
        case 'POLYGON':
          chainEnum = Chain.POLYGON;
          break;
        case 'OPTIMISM':
          chainEnum = Chain.OPTIMISM;
          break;
        default:
          chainEnum = Chain.ETHEREUM; // Default fallback
      }
      
      allocations.push({
        strategyId: strategy.id,
        chain: chainEnum,
        protocol: protocol || 'staking',
        asset: chain === 'avalanche' ? 'AVAX' : chain === 'polygon' ? 'MATIC' : 'ETH',
        percentage: (Number(amount) / walletBalance) * 100,
        targetAmount: Number(amount),
        apy: marketData[`${chain}${protocol || 'Staking'}APY`] || null,
      });
    }

    if (allocations.length > 0) {
      await prisma.allocation.createMany({
        data: allocations,
      });
    }

    // Create agent decision record
    await prisma.agentDecision.create({
      data: {
        userId: req.user.id,
        strategyId: strategy.id,
        decisionType: 'INITIAL_ALLOCATION',
        reasoning: generatedStrategy.reasoning,
        marketData: marketData,
        action: generatedStrategy.actions.join(', '),
        status: 'PENDING',
      },
    });

    // Fetch the complete strategy with allocations
    const completeStrategy = await prisma.strategy.findUnique({
      where: { id: strategy.id },
      include: {
        allocations: true,
        agentDecisions: true,
      },
    });

    res.status(201).json({
      strategy: completeStrategy,
      generatedStrategy,
    });
  } catch (error) {
    console.error('Error in generateAiStrategy:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
