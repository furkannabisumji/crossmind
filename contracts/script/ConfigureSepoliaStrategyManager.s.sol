// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

import "../src/StrategyManager.sol";

contract ConfigureSepoliaStrategyManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint64 sepoliaChainId = 11155111; // Sepolia
        address strategyManagerAddress = 0x5488BF397b074d8Efee58F315c0a2f793FCCEd75; // Sepolia StrategyManager
        address sepoliaReceiver = 0x82DCF4603a7f24aa6633B821fFC51032Cee21063; // CrossChainExecutor on Sepolia
        address aaveV3Adapter = 0xB361aB7b925c8F094F16407702d6fD275534d981; // AAVEV3Adapter on Sepolia

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Remove Fuji-related configuration, only add Sepolia chain
        // strategyManager.addSupportedChainId(sepoliaChainId, sepoliaReceiver);
        // console.log("Added Sepolia chainId:", uint256(sepoliaChainId));
        strategyManager.addProtocol(sepoliaChainId, "AAVEV3", aaveV3Adapter);
        console.log("Added protocol for adapter (Sepolia):", aaveV3Adapter);

        vm.stopBroadcast();
    }
}
