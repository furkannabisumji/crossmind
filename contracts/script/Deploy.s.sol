// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CrossMindVault.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        new CrossMindVault();
        vm.stopBroadcast();
    }
}
