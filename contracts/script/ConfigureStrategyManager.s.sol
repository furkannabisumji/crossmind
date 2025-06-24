// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/StrategyManager.sol";

contract ConfigureStrategyManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address strategyManagerAddress = 0x8B162A960CA4F45e219db23b90132bF6B0e56271; // Fuji StrategyManager
        uint64 sepoliaChainId = 11155111; // Sepolia
        uint64 fujiChainId = 43113; // Fuji
        address adapterAddress = 0x66118D36C7eeeD2134D6De444b60d2DD2DB310FD; // Fuji AaveV3Adapter
        address sepoliaReceiver = 0xD63dcF5091d3776D01d727b92d195cF54c10F0d2; // CrossChainExecutor on Sepolia
        address executorAddress = 0x8c10cce8Ad744B6620c8b1300C3cbf6f5CD835eC; // New Fuji CrossChainExecutor (correct router)

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Remove and re-add Sepolia chain config
        strategyManager.removeSupportedChainId(sepoliaChainId);
        console.log("Removed old Sepolia chainId:", uint256(sepoliaChainId));
        strategyManager.addSupportedChainId(sepoliaChainId, sepoliaReceiver);
        console.log("Added Sepolia chainId:", uint256(sepoliaChainId));
        strategyManager.addProtocol(
            sepoliaChainId,
            "TestAdapter",
            adapterAddress
        );
        console.log("Added protocol for adapter (Sepolia):", adapterAddress);

        // Remove and re-add Fuji chain config
        strategyManager.removeSupportedChainId(fujiChainId);
        console.log("Removed old Fuji chainId:", uint256(fujiChainId));
        strategyManager.addSupportedChainId(fujiChainId, executorAddress);
        console.log("Added Fuji chainId:", uint256(fujiChainId));
        strategyManager.addProtocol(fujiChainId, "TestAdapter", adapterAddress);
        console.log("Added protocol for adapter (Fuji):", adapterAddress);

        vm.stopBroadcast();
    }
}
