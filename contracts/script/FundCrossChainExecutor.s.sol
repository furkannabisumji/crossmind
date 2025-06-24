// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract FundCrossChainExecutorScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // New Fuji CrossChainExecutor address (with original router)
        address fujiExecutor = 0xF6D757241B1BBf59e9fB0e194E115c9F1665A8C7;

        vm.startBroadcast(deployerPrivateKey);

        // Send AVAX to the CrossChainExecutor for CCIP fees
        payable(fujiExecutor).transfer(0.01 ether);

        console.log("Sent AVAX to Fuji CrossChainExecutor");

        vm.stopBroadcast();
    }
}
