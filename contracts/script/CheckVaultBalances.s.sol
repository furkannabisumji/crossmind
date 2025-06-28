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

contract CheckVaultBalancesScript is Script {
    function run() external view {
        address vaultAddress = 0xfA205DB4D93006837C0CAb69095bBB7d601c82E6; // Sepolia
        address userAddress = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;

        console.log("=== Checking Vault Balances ===");
        console.log("Vault:", vaultAddress);
        console.log("User:", userAddress);

        ICrossMindVault vault = ICrossMindVault(vaultAddress);

        ICrossMindVault.Balance[] memory balances = vault.getBalance(
            userAddress
        );

        console.log("Number of balances:", balances.length);

        for (uint256 i = 0; i < balances.length; i++) {
            console.log("Balance", i, ":");
            console.log("  Amount:", balances[i].amount);
            console.log("  Risk:", balances[i].risk);
            console.log("  Locked:", balances[i].locked);

            if (!balances[i].locked) {
                console.log("  UNLOCKED - Can be used for strategy!");
            } else {
                console.log("  LOCKED - Cannot be used");
            }
        }
    }
}
