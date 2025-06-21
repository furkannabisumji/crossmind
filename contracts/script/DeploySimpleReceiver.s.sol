// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {SimpleReceiver} from "../src/SimpleReceiver.sol";

contract DeploySimpleReceiverScript is Script {
    function run() external {
        // ✅ تحميل عنوان CCIP Router على Sepolia من .env
        address router = vm.envAddress("CCIP_ROUTER");

        // ✅ بدء النشر
        vm.startBroadcast();

        SimpleReceiver receiver = new SimpleReceiver(router);
        console.log("SimpleReceiver deployed at:", address(receiver));

        vm.stopBroadcast();
    }
}
