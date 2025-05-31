export const dbConfig = {
  url: process.env.DATABASE_URL,
};

// Server configuration
export const serverConfig = {
  port: process.env.PORT || 3001,
  environment: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
  jwtExpire: '7d',
};

// AWS Bedrock configuration for AI agent
export const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
};

// Chainlink configuration
export const chainlinkConfig = {
  nodeUrl: process.env.CHAINLINK_NODE_URL,
};

// RPC URLs for different chains
export const rpcConfig = {
  ethereum: process.env.ETHEREUM_RPC_URL,
  avalanche: process.env.AVALANCHE_RPC_URL,
  base: process.env.BASE_RPC_URL,
  arbitrum: process.env.ARBITRUM_RPC_URL,
  polygon: process.env.POLYGON_RPC_URL,
  optimism: process.env.OPTIMISM_RPC_URL,
};

// Default risk profiles
export const riskProfiles = {
  conservative: {
    maxAllocationPerProtocol: 0.3, // 30%
    maxAllocationPerChain: 0.5, // 50%
    preferredAssetTypes: ['stablecoins', 'bluechip'],
  },
  moderate: {
    maxAllocationPerProtocol: 0.5, // 50%
    maxAllocationPerChain: 0.7, // 70%
    preferredAssetTypes: ['stablecoins', 'bluechip', 'midcap'],
  },
  aggressive: {
    maxAllocationPerProtocol: 0.7, // 70%
    maxAllocationPerChain: 0.9, // 90%
    preferredAssetTypes: ['stablecoins', 'bluechip', 'midcap', 'smallcap'],
  },
};
