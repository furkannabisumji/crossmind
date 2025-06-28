// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IStrategyManager {
    function executor() external view returns (address);

    function chains(uint64) external view returns (address receiver);

    function getVaults(address user) external view returns (bytes memory);
}

contract DebugCCIPConfigScript is Script {
    function run() external {
        address strategyManagerAddress = 0x224AF5c393f5456E57555951e8A8f32fD27F21C2;
        address user = 0x14D7795A2566Cd16eaA1419A26ddB643CE523655;
        uint64 fujiChainId = 43113;

        IStrategyManager manager = IStrategyManager(strategyManagerAddress);
        address executor = manager.executor();
        address receiver = manager.chains(fujiChainId);

        console.log("StrategyManager address:", strategyManagerAddress);
        console.log("Executor address:", executor);
        console.log("Fuji chainId:", fujiChainId);
        console.log("Receiver on Fuji:", receiver);
        console.log("User address:", user);
    }
}
