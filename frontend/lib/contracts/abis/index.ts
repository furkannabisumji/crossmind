import { strategyRegistryABI } from './strategy-registry-abi';
import { portfolioABI } from './portfolio-abi';

/**
 * Centralized export of all contract ABIs
 * Add new ABIs here as they are created
 */
export const ABIS = {
  StrategyRegistry: strategyRegistryABI,
  Portfolio: portfolioABI,
} as const;

/**
 * Type for contract names based on the ABIS object
 */
export type ContractName = keyof typeof ABIS;
