// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../src/CrossMindVault.sol";
import "../lib/forge-std/src/console2.sol";

contract DepositNewBalanceScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address vaultAddress = 0xfA205DB4D93006837C0CAb69095bBB7d601c82E6;
        address usdcAddress = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // USDC on Sepolia
        uint256 depositAmount = 10000000; // 10 USDC (6 decimals)

        vm.startBroadcast(deployerPrivateKey);

        CrossMindVault vault = CrossMindVault(vaultAddress);

        console2.log("Depositing", depositAmount, "USDC to vault");
        console2.log("Vault address:", vaultAddress);
        console2.log("USDC address:", usdcAddress);

        // Approve USDC spending
        IERC20(usdcAddress).approve(vaultAddress, depositAmount);

        // Deposit with MEDIUM risk
        vault.deposit(depositAmount, CrossMindVault.Risk.MEDIUM);

        vm.stopBroadcast();

        console2.log("Deposit completed successfully!");
    }
}
