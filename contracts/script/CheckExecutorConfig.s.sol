// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface ICrossChainExecutor {
    function sendMessageOrToken(
        uint64 destinationChainSelector,
        address receiver,
        string calldata action,
        uint256 index,
        bytes calldata deposits,
        uint256 amount
    ) external returns (bytes32);
}

contract CheckExecutorConfigScript is Script {
    function run() external view {
        address executorAddress = 0x7d84d5EDee86B2AC25F8b987335Fb5359c6C9739; // CrossChainExecutor on Sepolia
        address expectedRouter = 0xD0daae2231E9CB96b94C8512223533293C3693Bf; // Expected CCIP Router

        console.log("=== CrossChainExecutor Configuration Check ===");
        console.log("Executor address:", executorAddress);
        console.log("Expected CCIP Router:", expectedRouter);
        console.log("");
        console.log("Note: CrossChainExecutor inherits from CCIPReceiver");
        console.log("Router is set in constructor and stored as immutable");
        console.log("");
        console.log("To verify router configuration, we need to:");
        console.log(
            "1. Check if the contract was deployed with correct router"
        );
        console.log("2. Verify the receiver address on Fuji");
        console.log("3. Test a simple message send");
    }
}
