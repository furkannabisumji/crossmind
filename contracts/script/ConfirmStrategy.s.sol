// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/StrategyManager.sol";

contract ConfirmStrategyScript is Script {
    function run() external {
        // تحميل الـ PRIVATE_KEY من ملف .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // استخدام العنوان الصحيح لـ StrategyManager حيث تم تسجيل الاستراتيجية
        address strategyManagerAddress = 0x224AF5c393f5456E57555951e8A8f32fD27F21C2;

        // الإعدادات الأساسية
        uint256 index = 0; // رقم الاستراتيجية المراد تأكيدها
        bool accepted = true; // هل تؤكد الاستراتيجية أم ترفضها؟

        // بدء البث باستخدام الـ private key الصحيح
        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // التحقق اليدوي من الـ chainId بناءً على التسجيل الأخير
        uint64 expectedChainId = 11155111; // Sepolia - يجب أن يتطابق مع التسجيل الأخير
        console.log(
            "Confirming strategy for chainId:",
            uint256(expectedChainId)
        );
        console.log("StrategyManager Address:", strategyManagerAddress);
        console.log("Index:", index);
        console.log("Accepted:", accepted);

        // تنفيذ تأكيد الاستراتيجية
        // ملاحظة: إذا ارتدّ، قد نحتاج تعديل StrategyManager للتعامل مع التنفيذ المحلي
        strategyManager.confirmStrategy(index, accepted);

        console.log("Strategy confirmed for index:", index);

        vm.stopBroadcast();
    }
}
