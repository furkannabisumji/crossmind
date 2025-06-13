// script/DeployCrossMind.s.sol
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

        // Chainlink CCIP router & LINK token on Fuji
        address routerAddress = 0xC2f6b0B1919Cf7370F25a8Db9FDBCfC40cEc1A38;
        address linkTokenAddress = 0x5947BB275c521040051D82396192181b413227A3;

        // Aave V3 PoolAddressesProvider on Fuji
        address aavePoolAddressesProvider = 0xe0F30cb149fAADC7247E953746Be9BbBB6B5751f;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy AdapterRegistry → needs owner address
        AdapterRegistry adapterRegistry = new AdapterRegistry(
            vm.addr(deployerPrivateKey)
        );
        console.log("AdapterRegistry deployed at:", address(adapterRegistry));

        // Deploy CrossChainExecutor → needs router & link token
        CrossChainExecutor executor = new CrossChainExecutor(
            routerAddress,
            linkTokenAddress
        );
        console.log("CrossChainExecutor deployed at:", address(executor));

        // Deploy CrossMindVault → needs registry & executor
        CrossMindVault vault = new CrossMindVault(
            address(adapterRegistry),
            address(executor)
        );
        console.log("CrossMindVault deployed at:", address(vault));

        // Deploy AaveV3Adapter → needs poolAddressesProvider
        AaveV3Adapter aaveAdapter = new AaveV3Adapter(
            aavePoolAddressesProvider
        );
        console.log("AaveV3Adapter deployed at:", address(aaveAdapter));

        // Deploy StrategyManager → needs vault + owner
        StrategyManager strategyManager = new StrategyManager(
            address(vault),
            vm.addr(deployerPrivateKey)
        );
        console.log("StrategyManager deployed at:", address(strategyManager));

        vm.stopBroadcast();
    }
}
