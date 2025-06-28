// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/StrategyManager.sol";

contract RegisterStrategyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address strategyManagerAddress = 0xf13b57fdaA552D952aCdb6a2Cd81C3078775C2d3; // New StrategyManager
        address adapterAddress = 0x3cfc9AA161e825F2878Fa8B46AaC72Ae32673FfA;
        uint64 chainId = 43113; // Avalanche Fuji

        uint256 amount = 10_000_000; // 10 USDC (with 6 decimals)
        uint256 index = 2; // use unlocked balance at index 2

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Setup Adapter Deposits
        StrategyManager.AdapterDeposit[]
            memory adapterDeposits = new StrategyManager.AdapterDeposit[](1);
        adapterDeposits[0] = StrategyManager.AdapterDeposit({
            adapter: adapterAddress,
            percentage: 100
        });

        // Setup Chain Deposits
        StrategyManager.ChainDeposit[]
            memory chainDeposits = new StrategyManager.ChainDeposit[](1);
        chainDeposits[0] = StrategyManager.ChainDeposit({
            chainId: chainId,
            amount: amount,
            deposits: adapterDeposits
        });

        // Setup Strategy
        StrategyManager.Strategy memory strategy = StrategyManager.Strategy({
            index: index,
            status: StrategyManager.Status.PENDING,
            amount: amount,
            deposits: chainDeposits
        });

        console.log("Registering strategy for index:", index);
        strategyManager.registerStrategy(strategy, index);
        console.log("Registered strategy for index:", index);

        vm.stopBroadcast();
    }
}
