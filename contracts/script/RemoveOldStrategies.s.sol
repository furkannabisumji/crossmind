// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/StrategyManager.sol";
import "../lib/forge-std/src/console2.sol";

contract RemoveOldStrategiesScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b;
        address user = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;

        vm.startBroadcast(deployerPrivateKey);

        console2.log("Checking current strategies...");
        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        StrategyManager.Strategy[] memory userVaults = strategyManager
            .getVaults(user);
        console2.log("Current strategies count:", userVaults.length);

        // Note: StrategyManager doesn't have a direct remove function
        // We might need to work with the existing strategies
        console2.log("StrategyManager doesn't have direct remove function");
        console2.log(
            "We need to work with existing strategies or find another approach"
        );

        vm.stopBroadcast();
    }
}
