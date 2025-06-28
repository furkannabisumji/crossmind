// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console2.sol";

interface IRouter {
    function addChainId(uint64 chainId, address receiver) external;
}

contract AddFujiChainDebugScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address routerAddress = 0x82DCF4603a7f24aa6633B821fFC51032Cee21063;
        uint64 fujiChainSelector = 12532609583862916517;
        address fujiExecutorAddress = 0xbb6868A91dE8a56565B0a290fb04648a8750d657;

        console2.log("=== Debug: Adding Fuji Chain ===");
        console2.log("Deployer address:", vm.addr(deployerPrivateKey));
        console2.log("Router address:", routerAddress);
        console2.log("Fuji chain selector:", fujiChainSelector);
        console2.log("Fuji executor address:", fujiExecutorAddress);

        vm.startBroadcast(deployerPrivateKey);

        console2.log("Calling addChainId...");

        IRouter router = IRouter(routerAddress);

        // Try to add Fuji chain
        try router.addChainId(fujiChainSelector, fujiExecutorAddress) {
            console2.log("SUCCESS: Fuji chain added successfully!");
        } catch Error(string memory reason) {
            console2.log("ERROR with reason:", reason);
        } catch (bytes memory lowLevelData) {
            console2.log(
                "ERROR with low level data:",
                vm.toString(lowLevelData)
            );
        }

        vm.stopBroadcast();

        console2.log("=== Debug Complete ===");
    }
}
