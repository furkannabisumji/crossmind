// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {CrossChainExecutor} from "../src/CrossChainExecutor.sol";

contract DeployCrossChainExecutorScript is Script {
    function run() external {
        // Load env vars
        address router = vm.envAddress("CCIP_ROUTER");
        address adapterRegistry = vm.envAddress("ADAPTER_REGISTRY");

        // Start broadcast
        vm.startBroadcast();

        // Deploy
        CrossChainExecutor executor = new CrossChainExecutor(
            router,
            adapterRegistry
        );

        console.log("CrossChainExecutor deployed at:", address(executor));

        vm.stopBroadcast();
    }
}
