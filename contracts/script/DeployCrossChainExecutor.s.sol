// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import {CrossChainExecutor} from "../src/CrossChainExecutor.sol";

contract DeployCrossChainExecutorScript is Script {
    function run() external {
        // Using Sepolia directly
        address routerAddress = 0xD0daae2231E9CB96b94C8512223533293C3693Bf; // Sepolia CCIP Router
        address adapterRegistry = 0x3014A74fd44017341dD471C73e9980D156c7Bc02; // Sepolia AdapterRegistry from contract-addresses.json

        vm.startBroadcast();

        CrossChainExecutor executor = new CrossChainExecutor(
            routerAddress,
            adapterRegistry
        );

        console.log("CrossChainExecutor deployed at:", address(executor));

        vm.stopBroadcast();
    }
}
