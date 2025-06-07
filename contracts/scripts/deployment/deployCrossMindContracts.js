// Deploy CrossMind contracts to multiple chains
const { ethers, network } = require("hardhat")
const { verify } = require("../../helper-functions")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const ccipConfig = require("../ccip.json")
async function deployCrossMindContracts(chainId) {
    const { getNamedAccounts, deployments } = await ethers.getSigners()
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    
    log("----------------------------------------------------")
    log(`Deploying CrossMind contracts to chain ${chainId}`)
    log("----------------------------------------------------")
    
    log("Deploying AdapterRegistry with placeholder addresses")
    const { tokenAddress, routerAddress, linkAddress, mainChain, chainSelector } = ccipConfig.chains.find((chain) => chain.chainId === chainId)
    if(mainChain){
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
    const executor = await deploy("CrossChainExecutor", {
        from: deployer,
        args: [
            routerAddress,
            linkAddress,
            deployer.address,
            '0x0000000000000000000000000000000000000000',
            strategyManager.address,
            vault.address
        ],
        log: true,
        verify: true
    });
    const strategyManagerContract = await ethers.getContractAt("StrategyManager", strategyManager.address)

    // Initialize StrategyManager with vault and executor addresses
    log("Initializing StrategyManager with vault and executor addresses...")
    const strategyTx = await strategyManagerContract.initialize(vault, executor)
    await strategyTx.wait()
    log(`Successfully initialized StrategyManager with vault address: ${vault} and executor address: ${executor}`)
    return {
        strategyManager: strategyManager.address,
        vault: vault.address,
        executor: executor.address
    }
    }
    const adapterRegistry = await deploy("AdapterRegistry", {
        from: deployer,
        args: [
            tokenAddress,
            routerAddress,
            linkAddress,
            deployer,
            deployer,
            chainSelector,
            mainChain
        ],
        log: true,
        verify: true
    })
    log(`AdapterRegistry deployed at ${adapterRegistry.address}`)
    
    // Deploy CrossChainExecutor with all the correct addresses
    log("Deploying CrossChainExecutor...")
    const executor = await deploy("CrossChainExecutor", {
        from: deployer,
        args: [
            routerAddress,
            linkAddress,
            deployer.address,
            adapterRegistry.address,
            '0x0000000000000000000000000000000000000000',
            '0x0000000000000000000000000000000000000000'
        ],
        log: true,
        verify: true
    })
    log(`CrossChainExecutor deployed at ${executor.address}`)

    // Get contract instances
    const adapterRegistryContract = await ethers.getContractAt("AdapterRegistry", adapterRegistry.address)
    
    log("Updating AdapterRegistry with executor address...")
    const adapterTx = await adapterRegistryContract.updateExecutor(executor)
    await adapterTx.wait()
    log(`Successfully updated AdapterRegistry with executor address: ${executor}`)
    // Return deployed contract addresses
    return {
        adapterRegistry: adapterRegistry.address,
        executor: executor.address,
    }
}

module.exports = { deployCrossMindContracts }
