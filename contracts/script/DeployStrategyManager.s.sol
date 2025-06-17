// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {StrategyManager} from "../src/StrategyManager.sol";

contract DeployStrategyManagerScript is Script {
    address constant VAULT = 0x0b030C4fD5a31016D753102a6E939019E9119bb2; // CrossMindVault الجديد
    address constant EXECUTOR = 0xe8ECACed7b444f3f1cF5e324b9657E4fBdb8dD7b; // CrossChainExecutor الجديد

    function run() external {
        vm.startBroadcast();

        StrategyManager manager = new StrategyManager(VAULT, EXECUTOR);
        console.log("StrategyManager deployed at:", address(manager));

        vm.stopBroadcast();
    }
}
