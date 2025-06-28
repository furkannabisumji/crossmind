// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";
import "../src/StrategyManager.sol";

contract RegisterStrategyNewScript is Script {
    function run() external {
        uint256 privateKey = 0x205f853dbfe5c84c9ef381559cfbbcee044b17b78f2bfe8f61ea004e9209d811;
        vm.startBroadcast(privateKey);

        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b; // New Sepolia
        uint256 balanceIndex = 3; // Use index 3 (unlocked balance)

        console.log("=== Registering Strategy in New StrategyManager ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("Balance Index:", balanceIndex);
        console.log("Using address:", vm.addr(privateKey));

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Create a simple strategy for Fuji
        StrategyManager.ChainDeposit[]
            memory chainDeposits = new StrategyManager.ChainDeposit[](1);
        StrategyManager.AdapterDeposit[]
            memory adapterDeposits = new StrategyManager.AdapterDeposit[](1);

        adapterDeposits[0] = StrategyManager.AdapterDeposit({
            adapter: 0xB361aB7b925c8F094F16407702d6fD275534d981, // AaveV3Adapter
            percentage: 100
        });

        chainDeposits[0] = StrategyManager.ChainDeposit({
            chainId: 12532609583862916517, // Fuji
            amount: 0,
            deposits: adapterDeposits
        });

        StrategyManager.Strategy memory strategy = StrategyManager.Strategy({
            index: balanceIndex,
            status: StrategyManager.Status.PENDING,
            amount: 0,
            deposits: chainDeposits
        });

        // Register the strategy
        try strategyManager.registerStrategy(strategy, balanceIndex) {
            console.log(
                "Strategy registered successfully in new StrategyManager!"
            );
        } catch Error(string memory reason) {
            console.log("Strategy registration failed with reason:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("Strategy registration failed with low level error");
            console.log("Error data length:", lowLevelData.length);
        }

        vm.stopBroadcast();
    }
}
