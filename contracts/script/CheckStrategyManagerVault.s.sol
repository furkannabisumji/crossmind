// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IStrategyManager {
    function vault() external view returns (address);
}

contract CheckStrategyManagerVaultScript is Script {
    function run() external {
        address strategyManagerAddress = 0x224AF5c393f5456E57555951e8A8f32fD27F21C2;
        IStrategyManager manager = IStrategyManager(strategyManagerAddress);
        address vaultAddress = manager.vault();
        console.log("StrategyManager address:", strategyManagerAddress);
        console.log(
            "Vault address used by this StrategyManager:",
            vaultAddress
        );
    }
}
