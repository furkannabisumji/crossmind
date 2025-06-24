// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/StrategyManager.sol";

contract ConfigureSepoliaStrategyManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address strategyManagerAddress = 0x224AF5c393f5456E57555951e8A8f32fD27F21C2; // Sepolia StrategyManager
        uint64 fujiChainId = 43113; // Fuji
        address newFujiExecutor = 0x8c10cce8Ad744B6620c8b1300C3cbf6f5CD835eC; // New Fuji CrossChainExecutor (correct router)

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // Update Fuji chain config with new CrossChainExecutor address
        strategyManager.removeSupportedChainId(fujiChainId);
        console.log("Removed old Fuji chainId:", uint256(fujiChainId));
        strategyManager.addSupportedChainId(fujiChainId, newFujiExecutor);
        console.log(
            "Added Fuji chainId with new executor:",
            uint256(fujiChainId)
        );

        vm.stopBroadcast();
    }
}
