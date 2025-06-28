// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

contract CheckContractExistsScript is Script {
    function run() external view {
        address strategyManagerAddress = 0xf13b57fdaA552D952aCdb6a2Cd81C3078775C2d3;

        console.log("=== Checking Contract Existence ===");
        console.log("StrategyManager:", strategyManagerAddress);

        uint256 codeSize = strategyManagerAddress.code.length;
        console.log("Contract code size:", codeSize);

        if (codeSize > 0) {
            console.log("Contract exists and has code!");
        } else {
            console.log("Contract does not exist or has no code!");
        }
    }
}
