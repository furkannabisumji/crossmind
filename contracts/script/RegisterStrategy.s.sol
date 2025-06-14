// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/StrategyManager.sol";

contract RegisterStrategyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address strategyManagerAddress = 0xe8B44aC3F920156846A79Ec2A74D770Ce395Dfe1;
        address adapterAddress = 0x3cfc9AA161e825F2878Fa8B46AaC72Ae32673FfA;
        uint64 chainId = 43113;

        uint256 amount = 1 ether;
        uint256 index = 0;

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // ----------- Adapter Deposits -----------
        StrategyManager.AdapterDeposit[] memory adapterDeposits = new StrategyManager.AdapterDeposit[](1);
        adapterDeposits[0] = StrategyManager.AdapterDeposit({
            adapter: adapterAddress,
            percentage: 100
        });

        // ----------- Chain Deposits -----------
        StrategyManager.ChainDeposit[] memory chainDeposits = new StrategyManager.ChainDeposit[](1);
        chainDeposits[0] = StrategyManager.ChainDeposit({
            chainId: chainId,
            amount: amount,
            deposits: adapterDeposits
        });

        // ----------- Strategy Setup -----------
        StrategyManager.Strategy memory strategy;
        strategy.index = index;
        strategy.status = StrategyManager.Status.REGISTERED;
        strategy.amount = amount;
        strategy.deposits = chainDeposits;

        console.log("Registering strategy for index:", index);
        strategyManager.registerStrategy(strategy, index);
        console.log("Registered strategy for index:", index);

        vm.stopBroadcast();
    }
}
