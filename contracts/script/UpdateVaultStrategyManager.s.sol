// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface ICrossMindVault {
    function setStrategyManager(address _strategyManager) external;

    function strategyManager() external view returns (address);
}

contract UpdateVaultStrategyManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address vaultAddress = 0x0b030C4fD5a31016D753102a6E939019E9119bb2;
        address newStrategyManager = 0xf13b57fdaA552D952aCdb6a2Cd81C3078775C2d3;

        vm.startBroadcast(deployerPrivateKey);

        ICrossMindVault vault = ICrossMindVault(vaultAddress);

        console.log("Current strategyManager:", vault.strategyManager());
        console.log("Updating to:", newStrategyManager);

        vault.setStrategyManager(newStrategyManager);

        console.log("Updated! New strategyManager:", vault.strategyManager());

        vm.stopBroadcast();
    }
}
