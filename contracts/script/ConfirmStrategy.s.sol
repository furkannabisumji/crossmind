// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/StrategyManager.sol";
import "../lib/forge-std/src/console2.sol";

contract ConfirmStrategyScript is Script {
    function run() external {
        // تحميل الـ PRIVATE_KEY من ملف .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // استخدام العنوان الرسمي لـ StrategyManager من الـ JSON
        address strategyManagerAddress = 0x5488BF397b074d8Efee58F315c0a2f793FCCEd75;
        address user = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655; // العنوان بتاعك

        // بدء البث باستخدام الـ private key الصحيح
        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // تحقق من وجود رصيد في الفولت قبل التسجيل
        ICrossMindVault vaultContract = ICrossMindVault(
            strategyManager.vault()
        );
        console2.log("Vault address from strategyManager:");
        console2.logAddress(strategyManager.vault());
        console2.log("User address for strategy:");
        console2.logAddress(user);
        ICrossMindVault.Balance[] memory balances = vaultContract.getBalance(
            user
        );
        console2.log("User vault balances length:");
        console2.logUint(balances.length);
        require(
            balances.length > 0,
            "No vault balance for user. Please deposit first."
        );

        // البحث عن أول رصيد غير مقفل
        uint256 unlockedIndex = type(uint256).max; // قيمة افتراضية تدل على عدم وجود رصيد غير مقفل
        for (uint256 i = 0; i < balances.length; i++) {
            console2.log("Balance index:");
            console2.logUint(i);
            console2.log("Balance amount:");
            console2.logUint(balances[i].amount);
            console2.log("Balance locked:");
            console2.logBool(balances[i].locked);
            
            if (!balances[i].locked && balances[i].amount > 0) {
                unlockedIndex = i;
                console2.log("Found unlocked balance at index:");
                console2.logUint(unlockedIndex);
                break;
            }
        }
        
        require(unlockedIndex != type(uint256).max, "No unlocked balance found");

        // إعداد Adapter Deposits
        StrategyManager.AdapterDeposit[]
            memory adapterDeposits = new StrategyManager.AdapterDeposit[](1);
        adapterDeposits[0] = StrategyManager.AdapterDeposit({
            adapter: 0xB361aB7b925c8F094F16407702d6fD275534d981, // AaveV3Adapter من الـ JSON
            percentage: 100
        });
        console2.log("adapterDeposits[0].adapter:");
        console2.logAddress(adapterDeposits[0].adapter);
        console2.log("adapterDeposits[0].percentage:");
        console2.logUint(adapterDeposits[0].percentage);

        // إعداد Chain Deposits
        StrategyManager.ChainDeposit[]
            memory chainDeposits = new StrategyManager.ChainDeposit[](1);
        chainDeposits[0] = StrategyManager.ChainDeposit({
            chainId: 11155111, // Sepolia
            amount: 10000000,
            deposits: adapterDeposits
        });
        console2.log("chainDeposits[0].chainId:");
        console2.logUint(chainDeposits[0].chainId);
        console2.log("chainDeposits[0].amount:");
        console2.logUint(chainDeposits[0].amount);
        console2.log("chainDeposits[0].deposits.length:");
        console2.logUint(chainDeposits[0].deposits.length);

        // إعداد Strategy باستخدام الفهرس الغير مقفل
        StrategyManager.Strategy memory strategy;
        strategy.index = unlockedIndex;
        strategy.amount = balances[unlockedIndex].amount; // استخدام المبلغ الفعلي للرصيد
        strategy.status = StrategyManager.Status.REGISTERED;
        strategy.deposits = chainDeposits;
        
        console2.log("Using strategy with:");
        console2.log("Index:");
        console2.logUint(strategy.index);
        console2.log("Amount:");
        console2.logUint(strategy.amount);

        // تسجيل الاستراتيجية باستخدام الفهرس الصحيح
        strategyManager.registerStrategy(strategy, unlockedIndex);

        console2.log("Strategy registered successfully for index:");
        console2.logUint(unlockedIndex);
        console2.log("StrategyManager Address:");
        console2.logAddress(strategyManagerAddress);

        // التحقق من تسجيل الاستراتيجية
        StrategyManager.Strategy[] memory userVaults = strategyManager
            .getVaults(user);
        console2.log("userVaults.length after registration:");
        console2.logUint(userVaults.length);
        require(userVaults.length > 0, "No strategies registered for user");
        
        for (uint256 i = 0; i < userVaults.length; i++) {
            console2.log("Strategy", i, ":");
            console2.log("  Index:");
            console2.logUint(userVaults[i].index);
            console2.log("  Amount:");
            console2.logUint(userVaults[i].amount);
            console2.log("  Status:");
            console2.logUint(uint256(userVaults[i].status));
        }

        vm.stopBroadcast();
    }
}
