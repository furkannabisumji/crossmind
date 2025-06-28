// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IStrategyManager {
    function owner() external view returns (address);
}

contract CheckStrategyManagerOwnerScript is Script {
    function run() external view {
        address strategyManagerAddress = 0x5488BF397b074d8Efee58F315c0a2f793FCCEd75; // Sepolia

        console.log("=== Checking StrategyManager Owner ===");
        console.log("StrategyManager:", strategyManagerAddress);

        IStrategyManager strategyManager = IStrategyManager(
            strategyManagerAddress
        );

        address owner = strategyManager.owner();
        console.log("Owner:", owner);

        address currentAddress = vm.addr(vm.envUint("PRIVATE_KEY"));
        console.log("Current Address:", currentAddress);

        if (owner == currentAddress) {
            console.log("You are the owner! You can configure the chain.");
        } else {
            console.log(
                "You are NOT the owner. You need the owner's private key."
            );
        }
    }
}
