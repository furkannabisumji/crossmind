import { Request, Response } from 'express';
import prisma from '../clients/prisma';
import { MarketDataInput } from '../types';
import { getChainlinkPriceData } from '../utils/chainlinkUtils';
import { fetchProtocolApy } from '../utils/blockchainUtils';
import { Chain } from '../generated/prisma';

/**
 * @desc    Fetch and store market data
 * @route   POST /api/market-data
 * @access  Private
 */
export const fetchAndStoreMarketData = async (req: Request, res: Response) => {
  try {
    const { chain, protocol, asset, source }: Partial<MarketDataInput> = req.body;
    
    // If specific protocol data is requested
    if (chain && protocol && asset) {
      // Fetch APY data
      const apy = await fetchProtocolApy(chain, protocol, asset);
      
      // Store in database
      const marketData = await prisma.marketData.create({
        data: {
          chain: chain as Chain,
          protocol,
          asset,
          apy,
          source: source || 'API',
        },
      });
      
      return res.status(201).json(marketData);
    }
    
    // If no specific protocol, fetch data for common protocols
    const marketDataEntries = [];
    
    // Fetch Ethereum staking APY
    const ethStakingApy = await fetchProtocolApy(Chain.ETHEREUM, 'staking', 'ETH');
    marketDataEntries.push({
      chain: Chain.ETHEREUM,
      protocol: 'staking',
      asset: 'ETH',
      apy: ethStakingApy,
      source: 'API',
    });
    
    // Fetch Avalanche staking APY
    const avaxStakingApy = await fetchProtocolApy(Chain.AVALANCHE, 'staking', 'AVAX');
    marketDataEntries.push({
      chain: Chain.AVALANCHE,
      protocol: 'staking',
      asset: 'AVAX',
      apy: avaxStakingApy,
      source: 'API',
    });
    
    // Fetch Base lending APY
    const baseLendingApy = await fetchProtocolApy(Chain.BASE, 'lending', 'USDC');
    marketDataEntries.push({
      chain: Chain.BASE,
      protocol: 'lending',
      asset: 'USDC',
      apy: baseLendingApy,
      source: 'API',
    });
    
    // Store all entries in database
    await prisma.marketData.createMany({
      data: marketDataEntries,
    });
    
    res.status(201).json({
      message: 'Market data fetched and stored successfully',
      count: marketDataEntries.length,
      data: marketDataEntries,
    });
  } catch (error) {
    console.error('Error in fetchAndStoreMarketData:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get latest market data
 * @route   GET /api/market-data/latest
 * @access  Private
 */
export const getLatestMarketData = async (req: Request, res: Response) => {
  try {
    // Get unique chain-protocol-asset combinations
    const uniqueCombinations = await prisma.$queryRaw`
      SELECT DISTINCT "chain", "protocol", "asset"
      FROM "MarketData"
    `;
    
    // For each combination, get the latest entry
    const latestData = [];
    
    for (const combo of uniqueCombinations as any[]) {
      const latest = await prisma.marketData.findFirst({
        where: {
          chain: combo.chain,
          protocol: combo.protocol,
          asset: combo.asset,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      
      if (latest) {
        latestData.push(latest);
      }
    }
    
    res.json(latestData);
  } catch (error) {
    console.error('Error in getLatestMarketData:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get market data history for a specific protocol
 * @route   GET /api/market-data/history
 * @access  Private
 */
export const getMarketDataHistory = async (req: Request, res: Response) => {
  try {
    const { chain, protocol, asset, days = 30 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    // Query market data history
    const history = await prisma.marketData.findMany({
      where: {
        chain: chain as any,
        protocol: protocol as string,
        asset: asset as string,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error in getMarketDataHistory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get Chainlink price feed data
 * @route   GET /api/market-data/price-feed/:feedId
 * @access  Private
 */
export const getPriceFeedData = async (req: Request, res: Response) => {
  try {
    const { feedId } = req.params;
    const { chain = 'ETHEREUM' } = req.query;
    
    // Fetch price data from Chainlink
    const priceData = await getChainlinkPriceData(feedId, chain as any);
    
    res.json(priceData);
  } catch (error) {
    console.error('Error in getPriceFeedData:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Compare APYs across different protocols
 * @route   GET /api/market-data/compare
 * @access  Private
 */
export const compareProtocolApys = async (req: Request, res: Response) => {
  try {
    // Get latest APY data for all protocols
    const latestApys = await prisma.$queryRaw`
      WITH ranked_data AS (
        SELECT 
          "chain", 
          "protocol", 
          "asset", 
          "apy",
          "timestamp",
          ROW_NUMBER() OVER (PARTITION BY "chain", "protocol", "asset" ORDER BY "timestamp" DESC) as rn
        FROM "MarketData"
      )
      SELECT "chain", "protocol", "asset", "apy", "timestamp"
      FROM ranked_data
      WHERE rn = 1
      ORDER BY "apy" DESC
    `;
    
    // Group by chain
    const byChain: Record<string, any[]> = {};
    
    for (const entry of latestApys as any[]) {
      const chain = entry.chain;
      
      if (!byChain[chain]) {
        byChain[chain] = [];
      }
      
      byChain[chain].push(entry);
    }
    
    // Group by protocol type
    const byProtocol: Record<string, any[]> = {};
    
    for (const entry of latestApys as any[]) {
      const protocol = entry.protocol;
      
      if (!byProtocol[protocol]) {
        byProtocol[protocol] = [];
      }
      
      byProtocol[protocol].push(entry);
    }
    
    res.json({
      topApys: latestApys,
      byChain,
      byProtocol,
    });
  } catch (error) {
    console.error('Error in compareProtocolApys:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
