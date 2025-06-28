// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

contract CheckCorrectExecutorScript is Script {
    function run() external view {
        address executorAddress = 0xD63dcF5091d3776D01d727b92d195cF54c10F0d2; // Correct Sepolia
        address expectedRouter = 0xE561d5E02207fb5eB32cca20a699E0d8919a1476; // From deployment logs

        console.log(
            "=== Checking Correct CrossChainExecutor Configuration ==="
        );
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
