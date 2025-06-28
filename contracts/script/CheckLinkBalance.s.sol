// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract CheckLinkBalanceScript is Script {
    function run() external {
        address linkToken = 0x779877A7B0D9E8603169DdbD7836e478b4624789; // LINK on Sepolia
        address executor = 0x7d84d5EDee86B2AC25F8b987335Fb5359c6C9739; // CrossChainExecutor

        IERC20 link = IERC20(linkToken);
        uint256 balance = link.balanceOf(executor);

        console.log("LINK balance of CrossChainExecutor:", balance);
        // LINK has 18 decimals
        console.log("LINK balance (formatted):", balance / 1e18, "LINK");
    }
}
