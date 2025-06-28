// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IStrategyManager {
    function getVaults(address user) external view returns (uint256[] memory);
}

contract CheckStrategiesNewManagerScript is Script {
    function run() external view {
        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b;
        address userAddress = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;

        console.log("=== Checking Strategies in New StrategyManager ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("User Address:", userAddress);

        IStrategyManager strategyManager = IStrategyManager(
            strategyManagerAddress
        );

        try strategyManager.getVaults(userAddress) returns (
            uint256[] memory strategies
        ) {
            console.log("Number of strategies:", strategies.length);
            for (uint256 i = 0; i < strategies.length; i++) {
                console.log("Strategy", i, ":", strategies[i]);
            }
        } catch Error(string memory reason) {
            console.log("Error getting strategies:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("Low level error getting strategies");
        }
    }
}
