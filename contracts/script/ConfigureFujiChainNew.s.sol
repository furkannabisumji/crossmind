// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";
import "../src/StrategyManager.sol";

contract ConfigureFujiChainNewScript is Script {
    function run() external {
        uint256 privateKey = 0x205f853dbfe5c84c9ef381559cfbbcee044b17b78f2bfe8f61ea004e9209d811;
        vm.startBroadcast(privateKey);

        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b; // New Sepolia
        uint64 fujiChainSelector = 12532609583862916517;
        address fujiReceiver = 0xF6D757241B1BBf59e9fB0e194E115c9F1665A8C7;

        console.log("=== Configuring Fuji Chain in New StrategyManager ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("Fuji Chain Selector:", fujiChainSelector);
        console.log("Fuji Receiver:", fujiReceiver);
        console.log("Using address:", vm.addr(privateKey));

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Add Fuji as a supported chain
        strategyManager.addSupportedChainId(fujiChainSelector, fujiReceiver);

        vm.stopBroadcast();

        console.log(
            "Fuji chain configured successfully in new StrategyManager!"
        );
    }
}
