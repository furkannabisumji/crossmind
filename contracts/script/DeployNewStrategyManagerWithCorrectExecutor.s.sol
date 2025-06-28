// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";
import "../src/StrategyManager.sol";

contract DeployNewStrategyManagerWithCorrectExecutorScript is Script {
    function run() external {
        uint256 privateKey = 0x205f853dbfe5c84c9ef381559cfbbcee044b17b78f2bfe8f61ea004e9209d811;
        vm.startBroadcast(privateKey);

        address vaultAddress = 0xfA205DB4D93006837C0CAb69095bBB7d601c82E6; // Sepolia Vault
        address correctExecutorAddress = 0xD63dcF5091d3776D01d727b92d195cF54c10F0d2; // Correct Sepolia Executor

        console.log(
            "=== Deploying New StrategyManager with Correct Executor ==="
        );
        console.log("Vault:", vaultAddress);
        console.log("Correct Executor:", correctExecutorAddress);
        console.log("Using address:", vm.addr(privateKey));

        StrategyManager strategyManager = new StrategyManager(
            vaultAddress,
            correctExecutorAddress
        );

        vm.stopBroadcast();

        console.log(
            "New StrategyManager deployed at:",
            address(strategyManager)
        );
    }
}
