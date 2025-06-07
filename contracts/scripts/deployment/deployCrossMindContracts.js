// Deploy CrossMind contracts to multiple chains
const { ethers, network } = require("hardhat")
const { verify } = require("../../helper-functions")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")

async function deployCrossMindContracts(chainId) {
    const { getNamedAccounts, deployments } = await ethers.getSigners()
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    
    log("----------------------------------------------------")
    log(`Deploying CrossMind contracts to chain ${chainId}`)
    log("----------------------------------------------------")
    
    log("Deploying AdapterRegistry with placeholder addresses...")
    const adapterRegistry = await deploy("AdapterRegistry", {
        from: deployer,
        args: [
            "0x0000000000000000000000000000000000000000", // token placeholder
            "0x0000000000000000000000000000000000000000", // executor placeholder
            "0x0000000000000000000000000000000000000000", // receiver placeholder
        ],
        log: true,
        verify: true
    })
    log(`AdapterRegistry deployed at ${adapterRegistry.address}`)
    
    // Deploy StrategyManager first
    log("Deploying StrategyManager...")
    const strategyManager = await deploy("StrategyManager", {
        from: deployer,
        args: [],
        log: true,
        verify: true
    })
    log(`StrategyManager deployed at ${strategyManager.address}`)
    
    // Deploy CrossMindVault
    log("Deploying CrossMindVault...")
    const vault = await deploy("CrossMindVault", {
        from: deployer,
        args: [
            strategyManager.address
        ],
        log: true,
        verify: true
    })
    log(`CrossMindVault deployed at ${vault.address}`)
    
    // Deploy CrossChainExecutor with all the correct addresses
    log("Deploying CrossChainExecutor...")
    const ccipRouterAddress = process.env.CCIP_ROUTER_ADDRESS || "0x0000000000000000000000000000000000000000"
    const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000"
    const executor = await deploy("CrossChainExecutor", {
        from: deployer,
        args: [
            ccipRouterAddress,
            linkTokenAddress,
            deployer.address,
            adapterRegistry.address,
            strategyManager.address,
            vault.address
        ],
        log: true,
        verify: true
    })
    log(`CrossChainExecutor deployed at ${executor.address}`)
    
    // Update contracts with correct addresses
    log("Initializing contracts with correct addresses...")
    
    // Get contract instances
    const strategyManagerContract = await ethers.getContractAt("StrategyManager", strategyManager.address)
    const adapterRegistryContract = await ethers.getContractAt("AdapterRegistry", adapterRegistry.address)
    
    // Initialize StrategyManager with vault and executor addresses
    log("Initializing StrategyManager with vault and executor addresses...")
    const strategyTx = await strategyManagerContract.initialize(vault.address, executor.address)
    await strategyTx.wait()
    log(`Successfully initialized StrategyManager with vault address: ${vault.address} and executor address: ${executor.address}`)
    
    // Update AdapterRegistry with executor address
    log("Updating AdapterRegistry with executor address...")
    const adapterTx = await adapterRegistryContract.updateExecutor(executor.address)
    await adapterTx.wait()
    log(`Successfully updated AdapterRegistry with executor address: ${executor.address}`)
    log(`Updated AdapterRegistry executor to ${executor.address}`)
    
    // Verify contracts on block explorer if not on a development chain
    if (!developmentChains.includes(networkName)) {
        log("Verifying contracts on block explorer...")
        await verify(vault.address, [tokenAddress, strategyManager.address, executor.address])
        await verify(strategyManager.address, [vault.address, executor.address])
        await verify(adapterRegistry.address, [tokenAddress, executor.address, strategyManager.address, chainId])
        await verify(executor.address, [
            routerAddress,
            linkAddress,
            deployer,
            deployer,
            tokenAddress,
            adapterRegistry.address,
            strategyManager.address,
            vault.address
        ])
    }
    
    // Return deployed contract addresses
    return {
        vault: vault.address,
        strategyManager: strategyManager.address,
        adapterRegistry: adapterRegistry.address,
        executor: executor.address,
        token: tokenAddress
    }
}

module.exports = { deployCrossMindContracts }
