// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console2.sol";

interface IRouter {
    function addChainId(uint64 chainId, address receiver) external;

    function getSupportedChains() external view returns (uint64[] memory);

    function isSupportedChain(uint64 chainId) external view returns (bool);

    function getChainReceiver(uint64 chainId) external view returns (address);
}

contract CheckFujiChainStatusScript is Script {
    function run() external view {
        address routerAddress = 0x82DCF4603a7f24aa6633B821fFC51032Cee21063;
        uint64 fujiChainSelector = 12532609583862916517;
        address fujiExecutorAddress = 0xbb6868A91dE8a56565B0a290fb04648a8750d657;

        console2.log("=== Fuji Chain Status Check ===");
        console2.log("Router address:", routerAddress);
        console2.log("Fuji chain selector:", fujiChainSelector);
        console2.log("Fuji executor address:", fujiExecutorAddress);

        IRouter router = IRouter(routerAddress);

        // Try to get supported chains
        try router.getSupportedChains() returns (uint64[] memory chains) {
            console2.log("Supported chains count:", chains.length);
            for (uint i = 0; i < chains.length; i++) {
                console2.log("Chain", i, ":", chains[i]);
            }
        } catch {
            console2.log("getSupportedChains() failed");
        }

        // Try to check if Fuji is supported
        try router.isSupportedChain(fujiChainSelector) returns (
            bool supported
        ) {
            console2.log("Fuji chain supported:", supported);
        } catch {
            console2.log("isSupportedChain() failed");
        }

        // Try to get chain receiver
        try router.getChainReceiver(fujiChainSelector) returns (
            address receiver
        ) {
            console2.log("Fuji chain receiver:", receiver);
        } catch {
            console2.log("getChainReceiver() failed");
        }

        console2.log("=== Status Check Complete ===");
    }
}
