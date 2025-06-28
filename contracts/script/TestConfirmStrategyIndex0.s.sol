// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IStrategyManager {
    function confirmStrategy(uint256 index, bool accepted) external;
}

contract TestConfirmStrategyIndex0Script is Script {
    function run() external {
        uint256 privateKey = 0x205f853dbfe5c84c9ef381559cfbbcee044b17b78f2bfe8f61ea004e9209d811;
        vm.startBroadcast(privateKey);

        address strategyManagerAddress = 0xf13b57fdaA552D952aCdb6a2Cd81C3078775C2d3;
        uint256 strategyIndex = 0;

        console.log("=== Testing ConfirmStrategy (Index 0) ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("Strategy Index:", strategyIndex);
        console.log("Using address:", vm.addr(privateKey));

        IStrategyManager strategyManager = IStrategyManager(
            strategyManagerAddress
        );

        console.log("Attempting to confirm strategy...");

        try strategyManager.confirmStrategy(strategyIndex, true) {
            console.log("Strategy confirmed successfully!");
        } catch Error(string memory reason) {
            console.log("Strategy confirmation failed with reason:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("Strategy confirmation failed with low level error");
            console.log("Error data length:", lowLevelData.length);
        }

        vm.stopBroadcast();
    }
}
