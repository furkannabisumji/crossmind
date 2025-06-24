// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CrossChainExecutor.sol";

contract TestCrossChainExecutorScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // New Fuji CrossChainExecutor address (with original router)
        address fujiExecutor = 0xF6D757241B1BBf59e9fB0e194E115c9F1665A8C7;

        // Test parameters
        uint64 destinationChainSelector = 11155111; // Sepolia
        address receiver = 0xD63dcF5091d3776D01d727b92d195cF54c10F0d2; // Sepolia CrossChainExecutor
        uint256 strategyId = 0;
        bytes memory payload = abi.encode("executeStrategy", 0, "");
        address token = address(0);
        uint256 amount = 10000000; // 10 USDC

        vm.startBroadcast(deployerPrivateKey);

        // Test the sendCrossChain function
        CrossChainExecutor(payable(fujiExecutor)).sendCrossChain(
            destinationChainSelector,
            receiver,
            strategyId,
            payload,
            token,
            amount
        );

        vm.stopBroadcast();
    }
}
