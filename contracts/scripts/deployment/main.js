// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { network, run } = require("hardhat")

const { deployCrossMindContracts } = require("./deployCrossMindContracts")
const fs = require("fs")

async function main() {
    await run("compile")
    const chainId = network.config.chainId
    const networkName = network.name
    
    // Deploy CrossMind contracts
    console.log(`Deploying CrossMind contracts to ${networkName} (Chain ID: ${chainId})...`)
    const deployedContracts = await deployCrossMindContracts(chainId)
    
    // Save deployed contract addresses to a JSON file
    const deploymentPath = `./deployments/${networkName}`
    if (!fs.existsSync(deploymentPath)) {
        fs.mkdirSync(deploymentPath, { recursive: true })
    }
    
    fs.writeFileSync(
        `${deploymentPath}/CrossMindDeployment.json`,
        JSON.stringify(deployedContracts, null, 2)
    )
    console.log(`Deployment addresses saved to ${deploymentPath}/CrossMindDeployment.json`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
