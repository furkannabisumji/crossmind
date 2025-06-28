// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/StrategyManager.sol";
import "../lib/forge-std/src/console2.sol";

contract RegisterStrategyWithUnlockedBalanceScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b;
        address user = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;
        uint256 balanceIndex = 4; // Using balance index 4 (unlocked)

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Create strategy for Fuji chain with AaveV3Adapter
        StrategyManager.ChainDeposit[]
            memory chainDeposits = new StrategyManager.ChainDeposit[](1);
        StrategyManager.AdapterDeposit[]
            memory adapterDeposits = new StrategyManager.AdapterDeposit[](1);

        adapterDeposits[0] = StrategyManager.AdapterDeposit({
            adapter: 0xB361aB7b925c8F094F16407702d6fD275534d981, // AaveV3Adapter on Sepolia
            percentage: 100
        });

        chainDeposits[0] = StrategyManager.ChainDeposit({
            chainId: 12532609583862916517, // Fuji chain selector
            amount: 0, // Will be calculated by the contract
            deposits: adapterDeposits
        });

        StrategyManager.Strategy memory strategy = StrategyManager.Strategy({
            index: balanceIndex,
            status: StrategyManager.Status.PENDING,
            amount: 0, // Will be set by the contract
            deposits: chainDeposits
        });

        console2.log("Registering strategy with balance index:", balanceIndex);
        strategyManager.registerStrategy(strategy, balanceIndex);

        vm.stopBroadcast();

        console2.log("Strategy registered successfully!");
    }
}
