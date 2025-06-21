// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CrossMindVault.sol";

contract DeployCrossMindVaultScript is Script {
    function run() external {
        vm.startBroadcast();

        // ✅ استخدم parseAddr لتحويل string → address
        address token = parseAddr("0x5425890298aEd601595A70AB815C96711A31Bc65");
        address strategyManager = parseAddr(
            "0x8B162A960CA4F45e219db23b90132bF6B0e56271"
        );

        CrossMindVault vault = new CrossMindVault(token, strategyManager);
        console.log("Vault deployed at:", address(vault));

        vm.stopBroadcast();
    }

    // 🔧 Helper function to parse string to address
    function parseAddr(string memory _a) internal pure returns (address) {
        bytes memory tmp = bytes(_a);
        uint160 iaddr = 0;
        uint160 b1;
        uint160 b2;
        for (uint i = 2; i < 2 + 2 * 20; i += 2) {
            iaddr *= 256;
            b1 = uint160(uint8(tmp[i]));
            b2 = uint160(uint8(tmp[i + 1]));
            b1 = b1 >= 97 ? b1 - 87 : b1 >= 65 ? b1 - 55 : b1 - 48;
            b2 = b2 >= 97 ? b2 - 87 : b2 >= 65 ? b2 - 55 : b2 - 48;
            iaddr += (b1 * 16 + b2);
        }
        return address(iaddr);
    }
}
