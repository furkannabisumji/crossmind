// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface ICrossMindVault {
    struct Balance {
        uint256 amount;
        uint8 risk;
        bool locked;
    }

    function getBalance(address user) external view returns (Balance[] memory);
}

interface IStrategyManager {
    function getVaults(address user) external view returns (uint256[] memory);

    function getStrategy(
        uint256 strategyId
    )
        external
        view
        returns (
            address user,
            uint256 balanceIndex,
            address protocol,
            uint256 amount,
            bool confirmed
        );
}

contract CheckDetailedStrategyInfoScript is Script {
    function run() external view {
        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b;
        address vaultAddress = 0xfA205DB4D93006837C0CAb69095bBB7d601c82E6;
        address userAddress = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;

        console.log("=== Detailed Balance and Strategy Info ===");
        console.log("StrategyManager:", strategyManagerAddress);
        console.log("Vault Address:", vaultAddress);
        console.log("User Address:", userAddress);

        ICrossMindVault vault = ICrossMindVault(vaultAddress);
        IStrategyManager strategyManager = IStrategyManager(
            strategyManagerAddress
        );

        // طباعة تفاصيل جميع أرصدة المستخدم
        try vault.getBalance(userAddress) returns (
            ICrossMindVault.Balance[] memory userBalances
        ) {
            console.log("Balance count:", userBalances.length);
            for (uint256 i = 0; i < userBalances.length; i++) {
                console.log("Balance", i, ":");
                console.log("  Amount:", userBalances[i].amount);
                console.log("  Risk:", userBalances[i].risk);
                console.log("  Locked:", userBalances[i].locked);
            }
        } catch Error(string memory reason) {
            console.log("Error getting balances:", reason);
        }

        console.log("---");

        // طباعة تفاصيل الاستراتيجيات
        try strategyManager.getVaults(userAddress) returns (
            uint256[] memory strategies
        ) {
            console.log("Number of strategies:", strategies.length);
            for (uint256 i = 0; i < strategies.length; i++) {
                uint256 strategyId = strategies[i];
                console.log("Strategy ID:", strategyId);
                try strategyManager.getStrategy(strategyId) returns (
                    address user,
                    uint256 balanceIndex,
                    address protocol,
                    uint256 amount,
                    bool confirmed
                ) {
                    console.log("Strategy", i, "details:");
                    console.log("  User:", user);
                    console.log("  Balance Index:", balanceIndex);
                    console.log("  Protocol:", protocol);
                    console.log("  Amount:", amount);
                    console.log("  Confirmed:", confirmed);
                } catch Error(string memory reason) {
                    console.log(
                        "Error getting strategy",
                        i,
                        "details:",
                        reason
                    );
                }
            }
        } catch Error(string memory reason) {
            console.log("Error getting strategies:", reason);
        }
    }
}
