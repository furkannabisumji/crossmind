// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IRouterClient {
    function getFee(
        uint64 destinationChainSelector,
        bytes calldata message
    ) external view returns (uint256 fee);
}

contract TestRouterFeeScript is Script {
    function run() external view {
        address routerAddress = 0xD0daae2231E9CB96b94C8512223533293C3693Bf;
        uint64 fujiChainSelector = 12532609583862916517;

        console.log("=== Testing CCIP Router Fee ===");
        console.log("Router:", routerAddress);
        console.log("Destination Chain:", fujiChainSelector);

        IRouterClient router = IRouterClient(routerAddress);

        // Create a simple test message
        bytes memory testMessage = abi.encode(
            address(0xF6D757241B1BBf59e9fB0e194E115c9F1665A8C7), // receiver
            abi.encode("test", 0, ""), // data
            new address[](0), // tokenAmounts
            "", // extraArgs
            address(0) // feeToken
        );

        console.log("Testing getFee...");

        try router.getFee(fujiChainSelector, testMessage) returns (
            uint256 fee
        ) {
            console.log("Fee estimate:", fee);
            console.log("Router is working correctly!");
        } catch Error(string memory reason) {
            console.log("Router error:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("Router low level error");
        }
    }
}
