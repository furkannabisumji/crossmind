// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRouter {
    function addChainId(uint64 chainId, address receiver) external;
}

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console2.sol";

contract AddFujiChain is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Router address on Sepolia
        address routerAddress = 0x82DCF4603a7f24aa6633B821fFC51032Cee21063;

        // Fuji chain selector
        uint64 fujiChainSelector = 12532609583862916517;

        // CrossChainExecutor address on Fuji
        address fujiExecutorAddress = 0xbb6868A91dE8a56565B0a290fb04648a8750d657;

        vm.startBroadcast(deployerPrivateKey);

        console2.log("Adding Fuji chain to Router...");
        console2.log("Router address:", routerAddress);
        console2.log("Fuji chain selector:", fujiChainSelector);
        console2.log("Fuji executor address:", fujiExecutorAddress);

        IRouter router = IRouter(routerAddress);
        router.addChainId(fujiChainSelector, fujiExecutorAddress);

        vm.stopBroadcast();

        console2.log("Fuji chain added successfully!");
    }
}
