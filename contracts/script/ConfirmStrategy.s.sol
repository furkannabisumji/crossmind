// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/StrategyManager.sol";
import "../lib/forge-std/src/console2.sol";

contract ConfirmStrategyScript is Script {
    function run() external {
        // تحميل الـ PRIVATE_KEY من ملف .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // استخدام العنوان الصحيح لـ StrategyManager المسجل في الفولت
        address strategyManagerAddress = 0xfaaFF49D9Cf0e5A103911Deaaf80445514E9A323; // Correct StrategyManager from Vault
        address user = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;
        uint256 index = 0; // Index of the strategy (only one strategy exists)

        // بدء البث باستخدام الـ private key الصحيح
        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Check if user has strategies
        StrategyManager.Strategy[] memory userVaults = strategyManager
            .getVaults(user);
        console2.log("User strategies count:", userVaults.length);

        require(userVaults.length > 0, "No strategies found for user");
        require(index < userVaults.length, "Strategy index out of bounds");

        console2.log(
            "Strategy status before confirmation:",
            uint256(userVaults[index].status)
        );
        console2.log("Confirming strategy for index:", index);

        strategyManager.confirmStrategy(index, true);

        console2.log("Confirmed strategy for index:", index);

        vm.stopBroadcast();
    }
}
