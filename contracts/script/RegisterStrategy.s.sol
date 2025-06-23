// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/StrategyManager.sol";

contract RegisterStrategyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address strategyManagerAddress = 0x224AF5c393f5456E57555951e8A8f32fD27F21C2; // العنوان الصحيح من الوثيقة
        address adapterAddress = 0x3cfc9AA161e825F2878Fa8B46AaC72Ae32673FfA;
        uint64 chainId = 43113; // Avalanche Fuji

        uint256 amount = 10_000_000; // 10 USDC (مع دقة 6 decimals)
        uint256 index = 0; // الإيداع الأول

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // إعداد Adapter Deposits
        StrategyManager.AdapterDeposit[]
            memory adapterDeposits = new StrategyManager.AdapterDeposit[](1);
        adapterDeposits[0] = StrategyManager.AdapterDeposit({
            adapter: adapterAddress,
            percentage: 100
        });

        // إعداد Chain Deposits
        StrategyManager.ChainDeposit[]
            memory chainDeposits = new StrategyManager.ChainDeposit[](1);
        chainDeposits[0] = StrategyManager.ChainDeposit({
            chainId: chainId,
            amount: amount,
            deposits: adapterDeposits
        });

        // إعداد Strategy
        StrategyManager.Strategy memory strategy;
        strategy.index = index;
        strategy.amount = amount; // المبلغ بتاع الإيداع
        strategy.deposits = chainDeposits;

        // تنبيه إذا كان الـ chainId أو adapter غير مسجلين (بدون تحقق مباشر)
        console.log("Registering strategy for index:", index);
        strategyManager.registerStrategy(strategy, index);
        console.log("Registered strategy for index:", index);

        vm.stopBroadcast();
    }
}
