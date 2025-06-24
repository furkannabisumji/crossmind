import { crossMindVaultABI } from "./cross-mind-vault-abi";
import { strategyManagerABI } from "./strategy-manager-abi";
import { aaveV3AdapterABI } from "./aavev3-adapter-abi";
import { crossChainExecutorABI } from "./cross-chain-excutor-abi";
import { adapterRegistryABI } from "./adapter-registry-abi";

/**
 * Centralized export of all contract ABIs
 * Add new ABIs here as they are created
 */
export const ABIS = {
  CrossMindVault: crossMindVaultABI,
  StrategyManager: strategyManagerABI,
  AaveV3Adapter: aaveV3AdapterABI,
  CrossChainExecutor: crossChainExecutorABI,
  AdapterRegistry: adapterRegistryABI,
} as const;

/**
 * Type for contract names based on the ABIS object
 */
export type ContractName = keyof typeof ABIS;
