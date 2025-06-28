// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IStrategyManager {
    function chains(uint64 chainId) external view returns (address receiver);
}

contract CheckChainConfigScript is Script {
    function run() external view {
        address strategyManagerAddress = 0x5488BF397b074d8Efee58F315c0a2f793FCCEd75; // Sepolia
        uint64 fujiChainSelector = 12532609583862916517;
        address expectedFujiReceiver = 0xF6D757241B1BBf59e9fB0e194E115c9F1665A8C7;

        console.log("=== Checking Chain Configuration ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("Fuji Chain Selector:", fujiChainSelector);
        console.log("Expected Fuji Receiver:", expectedFujiReceiver);

        IStrategyManager strategyManager = IStrategyManager(
            strategyManagerAddress
        );

        address configuredReceiver = strategyManager.chains(fujiChainSelector);
        console.log("Configured Receiver:", configuredReceiver);

        if (configuredReceiver == expectedFujiReceiver) {
            console.log("Chain configuration is correct!");
        } else if (configuredReceiver == address(0)) {
            console.log("ERROR: Fuji chain is not configured!");
            console.log("This is likely the cause of the revert.");
        } else {
            console.log("ERROR: Fuji chain is configured with wrong receiver!");
        }
    }
}
