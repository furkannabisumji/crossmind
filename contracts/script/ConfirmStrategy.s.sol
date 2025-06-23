// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/StrategyManager.sol";

contract ConfirmStrategyScript is Script {
    function run() external {
        // تحميل الـ PRIVATE_KEY من ملف .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // تحميل عنوان العقد من ملف .env
        address strategyManagerAddress = vm.envAddress("STRATEGY_MANAGER");

        // الإعدادات الأساسية
        uint256 index = 0; // رقم الاستراتيجية المراد تأكيدها
        bool accepted = true; // هل تؤكد الاستراتيجية أم ترفضها؟

        // بدء البث باستخدام الـ private key الصحيح
        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        console.log("Confirming strategy...");
        console.log("StrategyManager Address:", strategyManagerAddress);
        console.log("Index:", index);
        console.log("Accepted:", accepted);

        strategyManager.confirmStrategy(index, accepted);

        console.log("Strategy confirmed!");

        vm.stopBroadcast();
    }
}
