// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

import "../src/StrategyManager.sol";

contract ConfigureSepoliaStrategyManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint64 sepoliaChainId = 11155111; // Sepolia
        uint64 fujiChainId = 43113; // Fuji - add this as destination
        address strategyManagerAddress = 0x5488BF397b074d8Efee58F315c0a2f793FCCEd75; // Sepolia StrategyManager
        address aaveV3Adapter = 0xB361aB7b925c8F094F16407702d6fD275534d981; // AAVEV3Adapter on Sepolia
        
        // Fuji destination configuration
        address fujiCrossChainExecutor = 0xF6D757241B1BBf59e9fB0e194E115c9F1665A8C7; // Latest Fuji CrossChainExecutor
        address fujiAaveAdapter = 0x3cfc9AA161e825F2878Fa8B46AaC72Ae32673FfA; // Fuji adapter address

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Add Sepolia local protocol (if not already added)
        try strategyManager.addProtocol(sepoliaChainId, "AAVEV3", aaveV3Adapter) {
            console.log("Added Sepolia protocol for adapter:", aaveV3Adapter);
        } catch {
            console.log("Sepolia protocol already exists or failed to add");
        }

        // **Add Fuji as a supported destination chain**
        try strategyManager.addSupportedChainId(fujiChainId, fujiCrossChainExecutor) {
            console.log("Added Fuji as destination chain:", uint256(fujiChainId));
            console.log("Fuji receiver:", fujiCrossChainExecutor);
        } catch {
            console.log("Fuji chain already configured or failed to add");
        }

        // Add Fuji protocol so strategies can target it
        try strategyManager.addProtocol(fujiChainId, "AAVEV3_FUJI", fujiAaveAdapter) {
            console.log("Added Fuji protocol for adapter:", fujiAaveAdapter);
        } catch {
            console.log("Fuji protocol already exists or failed to add");
        }

        console.log("=== Configuration Summary ===");
        console.log("Sepolia StrategyManager:", strategyManagerAddress);
        console.log("Local chain (Sepolia):", uint256(sepoliaChainId));
        console.log("Cross-chain destination (Fuji):", uint256(fujiChainId));
        console.log("Fuji receiver (CrossChainExecutor):", fujiCrossChainExecutor);

        vm.stopBroadcast();
    }
}
