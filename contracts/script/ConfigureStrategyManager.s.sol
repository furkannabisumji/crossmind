// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/StrategyManager.sol";

contract ConfigureStrategyManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address strategyManagerAddress = 0x224AF5c393f5456E57555951e8A8f32fD27F21C2;
        uint64 chainId = 43113; // Avalanche Fuji
        address adapterAddress = 0x3cfc9AA161e825F2878Fa8B46AaC72Ae32673FfA;
        address receiverAddress = 0xe8ECACed7b444f3f1cF5e324b9657E4fBdb8dD7b; // CrossChainExecutor على Avalanche Fuji

        vm.startBroadcast(deployerPrivateKey);

        StrategyManager strategyManager = StrategyManager(
            strategyManagerAddress
        );

        // إضافة الـ chainId مع receiver صحيح
        strategyManager.addSupportedChainId(chainId, receiverAddress);
        console.log("Added chainId:", uint256(chainId));

        // إضافة البروتوكول
        strategyManager.addProtocol(chainId, "TestAdapter", adapterAddress);
        console.log("Added protocol for adapter:", adapterAddress);

        vm.stopBroadcast();
    }
}
