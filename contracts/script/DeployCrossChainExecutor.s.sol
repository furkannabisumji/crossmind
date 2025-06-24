// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {CrossChainExecutor} from "../src/CrossChainExecutor.sol";

contract DeployCrossChainExecutorScript is Script {
    function run() external {
        string memory network = vm.envString("NETWORK"); // "fuji" or "sepolia"

        address routerAddress;
        address adapterRegistry;

        if (keccak256(bytes(network)) == keccak256(bytes("fuji"))) {
            routerAddress = 0x88E492127709447A5ABEFdaB8788a15B4567589E; // Fuji CCIP Router (original)
            adapterRegistry = 0x813F86D4Ecf3eFd328072D684f558c3B78a1b841; // Fuji AdapterRegistry
        } else if (keccak256(bytes(network)) == keccak256(bytes("sepolia"))) {
            routerAddress = 0xD0daae2231E9CB96b94C8512223533293C3693Bf; // Sepolia CCIP Router
            adapterRegistry = 0x1B5530DdB27dD00e73960f45E4232a936826F0a6; // Sepolia AdapterRegistry
        } else {
            revert("Unsupported network. Use 'fuji' or 'sepolia'");
        }

        vm.startBroadcast();

        CrossChainExecutor executor = new CrossChainExecutor(
            routerAddress,
            adapterRegistry
        );

        console.log("CrossChainExecutor deployed at:", address(executor));

        vm.stopBroadcast();
    }
}
