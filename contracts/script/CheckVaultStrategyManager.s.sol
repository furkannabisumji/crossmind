// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface ICrossMindVault {
    function strategyManager() external view returns (address);
}

contract CheckVaultStrategyManagerScript is Script {
    function run() external {
        address vaultAddress = 0xD106F14750695E56E78F039da3eaF7136a86dbFa;

        ICrossMindVault vault = ICrossMindVault(vaultAddress);
        address currentStrategyManager = vault.strategyManager();

        console.log("Vault address:", vaultAddress);
        console.log(
            "Current strategyManager in vault:",
            currentStrategyManager
        );
        console.log(
            "Expected strategyManager:",
            0x224AF5c393f5456E57555951e8A8f32fD27F21C2
        );

        if (
            currentStrategyManager == 0x224AF5c393f5456E57555951e8A8f32fD27F21C2
        ) {
            console.log("Addresses match!");
        } else {
            console.log("Addresses don't match!");
        }
    }
}
