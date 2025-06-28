// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

contract CheckAddressScript is Script {
    function run() external {
        console.log("=== Checking Address ===");
        console.log("msg.sender:", msg.sender);
        console.log("tx.origin:", tx.origin);
        console.log(
            "Expected owner: 0x14D7795A2566Cd16eaA1419A26ddB643CE523655"
        );

        if (msg.sender == 0x14D7795A2566Cd16eaA1419A26ddB643CE523655) {
            console.log("Address is correct!");
        } else {
            console.log("Address is WRONG!");
        }
    }
}
