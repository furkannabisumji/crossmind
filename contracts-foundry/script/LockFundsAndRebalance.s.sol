// script/LockFundsAndRebalance.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/CrossMindVault.sol";
import "../src/StrategyManager.sol";

contract LockFundsAndRebalanceScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Addresses from your previous deploy
        address vaultAddress = 0x8F9bb932990E32E548E9E1eb693E75253E566Be3;
        address strategyManagerAddress = 0xe8B44aC3F920156846A79Ec2A74D770Ce395Dfe1;

        // Your wallet address (the one you used to deposit)
        // ⚠️ IMPORTANT: Replace this with your actual wallet address (correct checksum)!
        address userAddress = address(0); // ← placeholder to avoid compile error → replace with your address

        // Index of the balance you want to rebalance
        uint256 index = 0; // Assuming first balance index is 0

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        console.log("Triggering rebalance for user:");
        console.logAddress(userAddress);
        console.log("Using index:");
        console.log(index);

        // Call triggerRebalance (must be called from executor address)
        strategyManager.triggerRebalance(userAddress, index);

        console.log("Triggered strategy rebalance for user:");
        console.logAddress(userAddress);
        console.log("Index:");
        console.log(index);

        vm.stopBroadcast();
    }
}
