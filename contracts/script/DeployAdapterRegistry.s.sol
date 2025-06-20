// script/DeployAdapterRegistry.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {AdapterRegistry} from "../src/AdapterRegistry.sol";

contract DeployAdapterRegistryScript is Script {
    function run() external {
        // نقرأ العنوان من .env
        address token = vm.envAddress("CCIP_ROUTER");

        // نبدأ تنفيذ الصفقة
        vm.startBroadcast();
        AdapterRegistry adapterRegistry = new AdapterRegistry(token);
        vm.stopBroadcast();

        console.log("AdapterRegistry deployed at:", address(adapterRegistry));
    }
}
