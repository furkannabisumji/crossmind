// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

contract TestDirectCallScript is Script {
    function run() external {
        address strategyManagerAddress = 0xf13b57fdaA552D952aCdb6a2Cd81C3078775C2d3;
        uint64 fujiChainSelector = 12532609583862916517;
        address fujiReceiver = 0xF6D757241B1BBf59e9fB0e194E115c9F1665A8C7;

        console.log("=== Testing Direct Call ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("Fuji Chain Selector:", fujiChainSelector);
        console.log("Fuji Receiver:", fujiReceiver);

        // Encode the function call
        bytes memory data = abi.encodeWithSignature(
            "addSupportedChainId(uint64,address)",
            fujiChainSelector,
            fujiReceiver
        );

        console.log("Encoded data length:", data.length);
        console.log("Attempting direct call...");

        vm.startBroadcast();

        (bool success, bytes memory result) = strategyManagerAddress.call(data);

        vm.stopBroadcast();

        if (success) {
            console.log("Call successful!");
        } else {
            console.log("Call failed!");
            console.log("Result length:", result.length);
        }
    }
}
