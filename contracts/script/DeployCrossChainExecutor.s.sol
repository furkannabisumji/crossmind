// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {CrossChainExecutor} from "../src/CrossChainExecutor.sol";

contract DeployCrossChainExecutorScript is Script {
    function run() external {
        // ✅ 1. Load addresses from .env file
        address router = vm.envAddress("CCIP_ROUTER");
        address adapterRegistry = vm.envAddress("ADAPTER_REGISTRY");

        // ✅ 2. Start broadcast with deployer wallet
        vm.startBroadcast();

        // ✅ 3. Deploy contract
        CrossChainExecutor executor = new CrossChainExecutor(
            router,
            adapterRegistry
        );

        // ✅ 4. Output deployed address
        console.log("CrossChainExecutor deployed at:", address(executor));

        vm.stopBroadcast();
    }
}
