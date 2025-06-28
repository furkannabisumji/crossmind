// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/StrategyManager.sol";
import "../src/CrossMindVault.sol";
import "../lib/forge-std/src/console2.sol";

contract UnlockStrategyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address strategyManagerAddress = 0x436b630550186555865F969b89803A76D18fAb2b;
        address vaultAddress = 0xfA205DB4D93006837C0CAb69095bBB7d601c82E6;
        address user = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;
        uint256 strategyIndex = 0;
        uint256 balanceIndex = 3; // The balance index used by strategy 0

        vm.startBroadcast(deployerPrivateKey);

        console2.log("Attempting to unlock strategy", strategyIndex);
        console2.log("Balance index:", balanceIndex);

        // Try to unlock the balance in the vault
        CrossMindVault vault = CrossMindVault(vaultAddress);
        vault.unlock(user, balanceIndex);

        console2.log("Unlock attempt completed");

        vm.stopBroadcast();
    }
}
