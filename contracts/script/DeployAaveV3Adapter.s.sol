// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/adapters/AaveV3Adapter.sol";

contract DeployAaveV3AdapterScript is Script {
    function run() external {
        // ✅ Aave V3 Pool address on Fuji (CHECKSUM FIXED)
        address aavePool = 0xE5765E8Fc6c9287aCf72ABD8465b0D20CFF62D0F;

        vm.startBroadcast();

        AaveV3Adapter adapter = new AaveV3Adapter(aavePool);
        console.log("AaveV3Adapter deployed at:", address(adapter));

        vm.stopBroadcast();
    }
}
