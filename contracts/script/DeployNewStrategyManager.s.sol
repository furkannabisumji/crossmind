// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";
import "../src/StrategyManager.sol";

contract DeployNewStrategyManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Use the correct vault and executor addresses
        address vaultAddress = 0x0b030C4fD5a31016D753102a6E939019E9119bb2;
        address executorAddress = 0x7d84d5EDee86B2AC25F8b987335Fb5359c6C9739;

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = new StrategyManager(
            vaultAddress,
            executorAddress
        );

        console.log(
            "New StrategyManager deployed at:",
            address(strategyManager)
        );
        console.log("Vault address:", vaultAddress);
        console.log("Executor address:", executorAddress);

        vm.stopBroadcast();
    }
}
