// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../lib/forge-std/src/Script.sol";
import "../src/StrategyManager.sol";
import "../lib/forge-std/src/console2.sol";

contract CheckStrategyDetailsScript is Script {
    function run() external view {
        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b;
        address user = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );
        StrategyManager.Strategy[] memory strategies = strategyManager
            .getVaults(user);

        console2.log("=== Strategy Details ===");
        console2.log("Total strategies:", strategies.length);

        for (uint256 i = 0; i < strategies.length; i++) {
            console2.log("Strategy", i, ":");
            console2.log("  Balance Index:", strategies[i].index);
            console2.log("  Status:", uint256(strategies[i].status));
            console2.log("  Amount:", strategies[i].amount);
            console2.log("  Chain Deposits:", strategies[i].deposits.length);

            for (uint256 j = 0; j < strategies[i].deposits.length; j++) {
                console2.log(
                    "    Chain",
                    j,
                    "ID:",
                    strategies[i].deposits[j].chainId
                );
                console2.log(
                    "    Chain",
                    j,
                    "Amount:",
                    strategies[i].deposits[j].amount
                );
            }
        }
    }
}
