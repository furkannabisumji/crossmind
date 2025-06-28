// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";
import "../src/StrategyManager.sol";

contract UpdateFujiReceiverScript is Script {
    function run() external {
        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b; // New StrategyManager on Sepolia
        uint64 fujiChainSelector = 12532609583862916517;
        address correctFujiReceiver = 0xbb6868A91dE8a56565B0a290fb04648a8750d657; // Correct CrossChainExecutor on Fuji

        console.log("=== Updating Fuji Receiver in StrategyManager ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("Fuji Chain Selector:", fujiChainSelector);
        console.log(
            "Current Receiver (from previous config):",
            0xF6D757241B1BBf59e9fB0e194E115c9F1665A8C7
        );
        console.log("New Correct Receiver:", correctFujiReceiver);

        vm.startBroadcast();

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Remove Fuji chain first
        console.log("Removing Fuji chain...");
        strategyManager.removeSupportedChainId(fujiChainSelector);

        // Add Fuji chain with correct receiver
        console.log("Adding Fuji chain with correct receiver...");
        strategyManager.addSupportedChainId(
            fujiChainSelector,
            correctFujiReceiver
        );

        vm.stopBroadcast();

        console.log("Fuji receiver updated successfully!");
    }
}
