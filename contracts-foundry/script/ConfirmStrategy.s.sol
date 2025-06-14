// script/ConfirmStrategy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/StrategyManager.sol";

contract ConfirmStrategyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address strategyManagerAddress = 0xe8B44aC3F920156846A79Ec2A74D770Ce395Dfe1;
        uint256 index = 0;
        bool accepted = true;

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        console.log("Confirming strategy with index:", index);
        console.log("Accepted:", accepted);

        strategyManager.confirmStrategy(index, accepted);

        console.log(
            "Confirmed strategy with index:",
            index,
            " accepted:",
            accepted
        );

        vm.stopBroadcast();
    }
}
