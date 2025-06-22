// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AdapterRegistry.sol";
import "../src/CrossChainExecutor.sol";
import "../src/CrossMindVault.sol";
import "../src/adapters/AaveV3Adapter.sol";
import "../src/StrategyManager.sol";

contract DeployCrossMindScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        string memory network = vm.envString("NETWORK"); // "fuji" أو "sepolia"

        address routerAddress;
        address linkTokenAddress;
        address aavePoolAddressesProvider;
        address usdc;

        if (keccak256(bytes(network)) == keccak256(bytes("fuji"))) {
            routerAddress = 0xC2f6b0B1919Cf7370F25a8Db9FDBCfC40cEc1A38;
            linkTokenAddress = 0x5947BB275c521040051D82396192181b413227A3;
            aavePoolAddressesProvider = 0xe0F30cb149fAADC7247E953746Be9BbBB6B5751f;
            usdc = 0x5425890298aed601595a70AB815c96711a31Bc65;
        } else if (keccak256(bytes(network)) == keccak256(bytes("sepolia"))) {
            routerAddress = 0xD0daae2231E9CB96b94C8512223533293C3693Bf; // Chainlink CCIP Router
            linkTokenAddress = 0x779877A7B0D9E8603169DdbD7836e478b4624789; // Chainlink LINK Token
            aavePoolAddressesProvider = 0xB279c1558b3E46d0f8A56B3C7c8B8992F7f49DeB; // Aave V3 Pool Addresses Provider
            usdc = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // USDC Mock Token
        } else {
            revert("Unsupported network. Use 'fuji' or 'sepolia'");
        }

        vm.startBroadcast(deployerPrivateKey);

        AdapterRegistry adapterRegistry = new AdapterRegistry(
            vm.addr(deployerPrivateKey)
        );
        console.log("AdapterRegistry deployed at:", address(adapterRegistry));

        CrossChainExecutor executor = new CrossChainExecutor(
            routerAddress,
            linkTokenAddress
        );
        console.log("CrossChainExecutor deployed at:", address(executor));

        CrossMindVault vault = new CrossMindVault(
            usdc,
            vm.addr(deployerPrivateKey)
        );
        console.log("Vault deployed at:", address(vault));

        StrategyManager strategyManager = new StrategyManager(
            address(vault),
            vm.addr(deployerPrivateKey)
        );
        console.log("StrategyManager deployed at:", address(strategyManager));

        vault.setStrategyManager(address(strategyManager));

        AaveV3Adapter aaveAdapter = new AaveV3Adapter(
            aavePoolAddressesProvider
        );
        console.log("AaveV3Adapter deployed at:", address(aaveAdapter));

        vm.stopBroadcast();
    }
}
