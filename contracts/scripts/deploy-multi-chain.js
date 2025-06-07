// Deploy CrossMind contracts to multiple chains
const { ethers, network, run } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { deployCrossMindContracts } = require("./deployment/deployCrossMindContracts");
const { networkConfig } = require("../helper-hardhat-config");

// Define the chains to deploy to
const chains = [
  "hardhat",    // For local testing
  "sepolia",    // Ethereum testnet
  "polygon",    // Polygon mainnet
  "avalanche",  // Avalanche mainnet
  "arbitrum",   // Arbitrum mainnet
  "base",       // Base mainnet
  "optimism"    // Optimism mainnet
];

// Create a mapping of chain names to their chain IDs
const chainIdMap = {};
Object.keys(networkConfig).forEach(chainId => {
  if (chainId !== "default" && networkConfig[chainId].name) {
    chainIdMap[networkConfig[chainId].name] = parseInt(chainId);
  }
});

async function deployToChain(chainName) {
  console.log(`\n=== Deploying to ${chainName} ===`);
  
  // Get the chain ID for the current chain
  const chainId = chainIdMap[chainName];
  if (!chainId) {
    console.error(`Chain ID not found for ${chainName}`);
    return null;
  }
  
  try {
    console.log(`Deploying CrossMind contracts to ${chainName} (Chain ID: ${chainId})...`);
    const deployedContracts = await deployCrossMindContracts(chainId);
    
    // Save deployed contract addresses to a JSON file
    const deploymentPath = `./deployments/${chainName}`;
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    fs.writeFileSync(
      `${deploymentPath}/CrossMindDeployment.json`,
      JSON.stringify(deployedContracts, null, 2)
    );
    console.log(`Deployment addresses saved to ${deploymentPath}/CrossMindDeployment.json`);
    
    return deployedContracts;
  } catch (error) {
    console.error(`Error deploying to ${chainName}:`, error);
    return null;
  }
}

async function main() {
  await run("compile");
  
  // Deploy to the current network specified in the hardhat command
  const currentNetwork = network.name;
  console.log(`Deploying to current network: ${currentNetwork}`);
  
  const deployedContracts = await deployToChain(currentNetwork);
  
  // Generate .env file with contract addresses for backend
  if (deployedContracts) {
    generateEnvFile(currentNetwork, deployedContracts);
  }
  
  console.log("\nDeployment complete!");
}

function generateEnvFile(chainName, contracts) {
  const envPath = path.join(__dirname, '..', '..', 'backend', '.env.contracts');
  
  // Create a prefix based on the chain name
  let prefix;
  switch (chainName) {
    case 'sepolia':
    case 'mainnet':
      prefix = 'ETH';
      break;
    case 'avalanche':
      prefix = 'AVAX';
      break;
    case 'polygon':
      prefix = 'POLY';
      break;
    case 'arbitrum':
      prefix = 'ARB';
      break;
    case 'base':
      prefix = 'BASE';
      break;
    case 'optimism':
      prefix = 'OP';
      break;
    default:
      prefix = chainName.toUpperCase();
  }
  
  // Generate environment variables
  const envVars = [
    `# Contract addresses for ${chainName}`,
    `${prefix}_VAULT_ADDRESS=${contracts.vault}`,
    `${prefix}_STRATEGY_MANAGER_ADDRESS=${contracts.strategyManager}`,
    `${prefix}_ADAPTER_REGISTRY_ADDRESS=${contracts.adapterRegistry}`,
    `${prefix}_CROSS_CHAIN_EXECUTOR_ADDRESS=${contracts.executor}`,
    `${prefix}_TOKEN_ADDRESS=${contracts.token}`,
    ''
  ];
  
  // Append to the .env.contracts file
  fs.appendFileSync(envPath, envVars.join('\n'));
  console.log(`Contract addresses for ${chainName} added to ${envPath}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
