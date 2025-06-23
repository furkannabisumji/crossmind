// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/StrategyManager.sol";

contract SetUSDCInSepoliaScript is Script {
    function run() external {
        // 🗝️ تحميل المفتاح الخاص من .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // 🏛️ تحميل عنوان العقد StrategyManager من .env
        address strategyManagerAddress = vm.envAddress("STRATEGY_MANAGER");

        // 💵 عنوان USDC Adapter على شبكة Sepolia (hardcoded أو استخدم vm.envAddress لاحقًا لو متغير)
        address usdcAddress = address(
            0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
        );

        // 🎬 بدء البث
        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // ✅ استدعاء دالة إضافة USDC لـ Sepolia
        strategyManager.setUSDCInSepolia(usdcAddress);

        console.log("USDC Adapter registered in Sepolia:");
        console.log("Address:", usdcAddress);

        vm.stopBroadcast();
    }
}
