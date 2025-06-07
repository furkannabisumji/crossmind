import { Request, Response } from 'express';
import { Chain } from '../generated/prisma';
import prisma from '../clients/prisma';
import {
  depositToVault,
  withdrawFromVault,
  executeStrategy,
  exitStrategy,
  getVaultBalances,
  getExecutedStrategies,
  getProtocols,
  getChainId,
  getChainEnum
} from '../utils/contractUtils';

/**
 * @desc    Deposit funds into the CrossMindVault
 * @route   POST /api/contracts/deposit
 * @access  Private
 */
export const deposit = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    // Deposit to vault
    const txHash = await depositToVault(
      Number(amount),
      req.user.walletAddress,
      Chain.ETHEREUM // Default to Ethereum
    );
    
    // Record transaction in database
    const transaction = await prisma.transaction.create({
      data: {
        user: { connect: { id: req.user.id } },
        strategy: { connect: { id: 'default-strategy' } }, // Connect to a default strategy or handle differently
        transactionType: 'DEPOSIT',
        chain: Chain.ETHEREUM,
        asset: 'USDC', // Default token, should be configurable
        amount: Number(amount),
        txHash,
        status: 'PENDING',
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Deposit initiated successfully',
      data: {
        transaction,
        txHash
      }
    });
  } catch (error: any) {
    console.error('Error in deposit:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to deposit funds' 
    });
  }
};

/**
 * @desc    Withdraw funds from the CrossMindVault
 * @route   POST /api/contracts/withdraw/:index
 * @access  Private
 */
export const withdraw = async (req: Request, res: Response) => {
  try {
    const { index } = req.params;
    
    if (!index || isNaN(Number(index))) {
      return res.status(400).json({ message: 'Valid index is required' });
    }
    
    // Get balance information first to know the amount
    const balances = await getVaultBalances(req.user.walletAddress);
    const balanceIndex = Number(index);
    
    if (!balances[balanceIndex] || balances[balanceIndex].locked) {
      return res.status(400).json({ 
        message: balances[balanceIndex]?.locked 
          ? 'This balance is locked in a strategy' 
          : 'Invalid balance index' 
      });
    }
    
    // Withdraw from vault
    const txHash = await withdrawFromVault(
      balanceIndex,
      req.user.walletAddress,
      Chain.ETHEREUM // Default to Ethereum
    );
    
    // Record transaction in database
    const transaction = await prisma.transaction.create({
      data: {
        user: { connect: { id: req.user.id } },
        strategy: { connect: { id: 'default-strategy' } }, // Connect to a default strategy or handle differently
        transactionType: 'WITHDRAWAL',
        chain: Chain.ETHEREUM,
        asset: 'USDC', // Default token, should be configurable
        amount: Number(balances[balanceIndex].amount) / 1e18, // Convert from wei
        txHash,
        status: 'PENDING',
      },
    });
    
    res.status(200).json({
      success: true,
      message: 'Withdrawal initiated successfully',
      data: {
        transaction,
        txHash
      }
    });
  } catch (error: any) {
    console.error('Error in withdraw:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to withdraw funds' 
    });
  }
};

/**
 * @desc    Execute a cross-chain investment strategy
 * @route   POST /api/contracts/execute-strategy
 * @access  Private
 */
export const executeInvestmentStrategy = async (req: Request, res: Response) => {
  try {
    const { strategies, balanceIndex, strategyId } = req.body;
    
    if (!strategies || !Array.isArray(strategies) || strategies.length === 0) {
      return res.status(400).json({ message: 'Valid strategies are required' });
    }
    
    if (balanceIndex === undefined || isNaN(Number(balanceIndex))) {
      return res.status(400).json({ message: 'Valid balance index is required' });
    }
    
    // Format strategies for contract interaction
    const formattedStrategies = strategies.map((strategy: any) => {
      return {
        chainId: getChainId(strategy.chain),
        index: Number(strategy.index || 0),
        deposits: strategy.allocations.map((allocation: any) => ({
          adapter: allocation.protocol,
          percentage: Math.round(allocation.percentage)
        }))
      };
    });
    
    // Execute strategy
    const txHash = await executeStrategy(
      formattedStrategies,
      Number(balanceIndex),
      req.user.walletAddress
    );
    
    // Update strategy in database if strategyId is provided
    if (strategyId) {
      await prisma.strategy.update({
        where: { id: strategyId },
        data: { active: true },
      });
      
      // Create agent decision record
      await prisma.agentDecision.create({
        data: {
          userId: req.user.id,
          strategyId,
          decisionType: 'INITIAL_ALLOCATION',
          reasoning: 'Strategy executed via smart contracts',
          marketData: {},
          action: 'Execute cross-chain strategy',
          status: 'EXECUTED',
          executedAt: new Date(),
        },
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Strategy execution initiated successfully',
      data: {
        txHash,
        strategies: formattedStrategies
      }
    });
  } catch (error: any) {
    console.error('Error in executeInvestmentStrategy:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to execute investment strategy' 
    });
  }
};

/**
 * @desc    Request to exit a strategy
 * @route   POST /api/contracts/exit-strategy/:index
 * @access  Private
 */
export const exitInvestmentStrategy = async (req: Request, res: Response) => {
  try {
    const { index } = req.params;
    
    if (!index || isNaN(Number(index))) {
      return res.status(400).json({ message: 'Valid strategy index is required' });
    }
    
    // Exit strategy
    const txHash = await exitStrategy(
      Number(index),
      req.user.walletAddress
    );
    
    res.status(200).json({
      success: true,
      message: 'Strategy exit request initiated successfully',
      data: {
        txHash,
        index: Number(index)
      }
    });
  } catch (error: any) {
    console.error('Error in exitInvestmentStrategy:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to exit investment strategy' 
    });
  }
};

/**
 * @desc    Get user's vault balances
 * @route   GET /api/contracts/balances
 * @access  Private
 */
export const getBalances = async (req: Request, res: Response) => {
  try {
    // Get balances from vault
    const balances = await getVaultBalances(req.user.walletAddress);
    
    res.status(200).json({
      success: true,
      data: balances
    });
  } catch (error: any) {
    console.error('Error in getBalances:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to get balances' 
    });
  }
};

/**
 * @desc    Get user's executed strategies
 * @route   GET /api/contracts/strategies
 * @access  Private
 */
export const getUserStrategies = async (req: Request, res: Response) => {
  try {
    // Get executed strategies
    const executedStrategies = await getExecutedStrategies(req.user.walletAddress);
    
    // Format strategies with chain information
    const formattedStrategies = executedStrategies.map(strategy => ({
      ...strategy,
      chain: getChainEnum(strategy.chainId),
      amount: Number(strategy.amount) / 1e18 // Convert from wei
    }));
    
    res.status(200).json({
      success: true,
      data: formattedStrategies
    });
  } catch (error: any) {
    console.error('Error in getUserStrategies:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to get user strategies' 
    });
  }
};

/**
 * @desc    Get available protocols for a chain
 * @route   GET /api/contracts/protocols/:chainId
 * @access  Private
 */
export const getChainProtocols = async (req: Request, res: Response) => {
  try {
    const { chainId } = req.params;
    
    if (!chainId || isNaN(Number(chainId))) {
      return res.status(400).json({ message: 'Valid chain ID is required' });
    }
    
    // Get protocols
    const protocols = await getProtocols(Number(chainId));
    
    res.status(200).json({
      success: true,
      data: protocols
    });
  } catch (error: any) {
    console.error('Error in getChainProtocols:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to get protocols' 
    });
  }
};
