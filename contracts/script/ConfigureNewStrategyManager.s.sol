// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";
import "../src/StrategyManager.sol";

contract ConfigureNewStrategyManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address strategyManagerAddress = 0xf13b57fdaA552D952aCdb6a2Cd81C3078775C2d3;

        // Fuji configuration
        uint64 fujiChainId = 43113;
        address fujiReceiver = 0x8c10cce8Ad744B6620c8b1300C3cbf6f5CD835eC;
        address fujiAdapter = 0x3cfc9AA161e825F2878Fa8B46AaC72Ae32673FfA;

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Add Fuji chain
        strategyManager.addSupportedChainId(fujiChainId, fujiReceiver);
        console.log("Added Fuji chain:", fujiChainId);

        // Add protocol for Fuji
        strategyManager.addProtocol(fujiChainId, "AaveV3", fujiAdapter);
        console.log("Added AaveV3 protocol for Fuji:", fujiAdapter);

        vm.stopBroadcast();
    }
}
