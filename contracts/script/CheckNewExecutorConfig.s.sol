// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

contract CheckNewExecutorConfigScript is Script {
    function run() external view {
        address executorAddress = 0x7d84d5EDee86B2AC25F8b987335Fb5359c6C9739; // From contract-addresses.json
        address expectedRouter = 0xD0daae2231E9CB96b94C8512223533293C3693Bf; // Expected CCIP Router

        console.log("=== Checking New CrossChainExecutor Configuration ===");
        console.log("Executor address:", executorAddress);
        console.log("Expected CCIP Router:", expectedRouter);

        uint256 codeSize = executorAddress.code.length;
        console.log("Contract code size:", codeSize);

        if (codeSize > 0) {
            console.log("Contract exists and has code!");
        } else {
            console.log("Contract does not exist or has no code!");
        }
    }
}
