import { RiskProfile, Chain, DecisionType, TransactionType } from '../generated/prisma'

// User types
export interface UserInput {
  walletAddress: string;
  email?: string;
  riskProfile?: RiskProfile;
}

// Strategy types
export interface StrategyInput {
  name: string;
  description?: string;
  objective: string;
  riskProfile: RiskProfile;
}

export interface AllocationInput {
  chain: Chain;
  protocol: string;
  asset: string;
  percentage: number;
  targetAmount?: number;
  apy?: number;
}

// Agent decision types
export interface AgentDecisionInput {
  strategyId: string;
  decisionType: DecisionType;
  reasoning: string;
  marketData: Record<string, any>;
  action: string;
}

// Transaction types
export interface TransactionInput {
  strategyId: string;
  agentDecisionId?: string;
  transactionType: TransactionType;
  chain: Chain;
  protocol?: string;
  asset: string;
  amount: number;
  txHash?: string;
}

// Deposit and withdrawal types
export interface DepositInput {
  amount: number;
  asset: string;
  txHash?: string;
}

export interface WithdrawalInput {
  amount: number;
  asset: string;
  txHash?: string;
}

// Market data types
export interface MarketDataInput {
  chain: Chain;
  protocol: string;
  asset: string;
  apy: number;
  tvl?: number;
  source: string;
}

// AI Agent types
export interface AgentPromptInput {
  objective: string;
  walletBalance: number;
  marketData: Record<string, any>;
  riskProfile: RiskProfile;
  history?: Record<string, any>[];
}

export interface AgentStrategyOutput {
  strategy: Record<string, any>;
  actions: string[];
  reasoning: string;
}

// Chainlink types
export interface ChainlinkFeedData {
  feedId: string;
  latestValue: number;
  timestamp: number;
}

export interface CCIPMessageData {
  sourceChain: Chain;
  destinationChain: Chain;
  payload: string;
  token?: string;
  amount?: number;
}

// Error response type
export interface ErrorResponse {
  message: string;
  stack?: string;
}
