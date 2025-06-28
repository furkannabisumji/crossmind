// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";
import "../src/StrategyManager.sol";

contract CheckStrategyManagerScript is Script {
    function run() external {
        address strategyManagerAddress = 0x5488BF397b074d8Efee58F315c0a2f793FCCEd75; // Sepolia
        address vaultAddress = 0xfA205DB4D93006837C0CAb69095bBB7d601c82E6; // Sepolia
        uint256 strategyIndex = 2;

        console.log("=== Checking StrategyManager Configuration ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("Vault:", vaultAddress);
        console.log("Strategy Index:", strategyIndex);

        StrategyManager strategyManager = StrategyManager(
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
    }
}
