// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console2.sol";

interface ICrossMindVault {
    struct Balance {
        uint256 amount;
        uint8 risk;
        bool locked;
    }

    function getBalance(address user) external view returns (Balance[] memory);
}

contract CheckBalanceStatusScript is Script {
    function run() external view {
        address vaultAddress = 0xfA205DB4D93006837C0CAb69095bBB7d601c82E6;
        address user = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;

        ICrossMindVault vault = ICrossMindVault(vaultAddress);

        ICrossMindVault.Balance[] memory balances = vault.getBalance(user);

        console2.log("Total balances:", balances.length);

        for (uint256 i = 0; i < balances.length; i++) {
            console2.log("Balance", i, ":");
            console2.log("  Amount:", balances[i].amount);
            console2.log("  Risk:", balances[i].risk);
            console2.log("  Locked:", balances[i].locked);
        }
    }
}
