// script/RegisterAdapter.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AdapterRegistry.sol";

contract RegisterAdapterScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address adapterRegistryAddress = 0x732bDE5798f20D96F71cdFC805227E97a4822090;
        address aaveAdapterAddress = 0x3cfc9AA161e825F2878Fa8B46AaC72Ae32673FfA;

        vm.startBroadcast(deployerPrivateKey);

        AdapterRegistry adapterRegistry = AdapterRegistry(
            adapterRegistryAddress
        );

        bytes32 adapterId = keccak256(abi.encodePacked("AAVEV3"));

        console.log(
            "AdapterRegistry does not implement registerAdapter() yet."
        );
        console.logBytes32(adapterId);
        console.logAddress(aaveAdapterAddress);

        vm.stopBroadcast();
    }
}
