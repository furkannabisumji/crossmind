// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CrossChainExecutor.sol";

// Mock Router for local testing
contract MockRouter {
    function getFee(
        uint64 destinationChainSelector,
        bytes memory message
    ) external pure returns (uint256) {
        return 0.001 ether; // Mock fee
    }

    function ccipSend(
        uint64 destinationChainSelector,
        bytes memory message
    ) external payable returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    destinationChainSelector,
                    message,
                    block.timestamp
                )
            );
    }
}

contract TestLocalCCIPScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock router
        MockRouter mockRouter = new MockRouter();

        // Deploy CrossChainExecutor with mock router
        CrossChainExecutor executor = new CrossChainExecutor(
            address(mockRouter),
            address(0) // Mock adapter registry
        );

        console.log("Mock Router deployed at:", address(mockRouter));
        console.log("Local CrossChainExecutor deployed at:", address(executor));

        // Test parameters
        uint64 destinationChainSelector = 11155111; // Sepolia
        address receiver = address(0x123); // Mock receiver
        uint256 strategyId = 0;
        bytes memory payload = abi.encode("executeStrategy", 0, "");
        address token = address(0);
        uint256 amount = 10000000; // 10 USDC

        // Test the sendCrossChain function locally
        try
            executor.sendCrossChain(
                destinationChainSelector,
                receiver,
                strategyId,
                payload,
                token,
                amount
            )
        returns (bytes32 messageId) {
            console.logBytes32(messageId);
        } catch Error(string memory reason) {
            console.log(reason);
        } catch (bytes memory lowLevelData) {
            // Optionally log low level data if needed
        }

        vm.stopBroadcast();
    }
}
