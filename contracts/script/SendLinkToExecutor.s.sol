// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Script.sol";
import "../lib/forge-std/src/console.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract SendLinkToExecutorScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address linkToken = 0x779877A7B0D9E8603169DdbD7836e478b4624789; // LINK on Sepolia
        address executor = 0x7d84d5EDee86B2AC25F8b987335Fb5359c6C9739; // CrossChainExecutor
        address sender = vm.addr(deployerPrivateKey);

        uint256 amountToSend = 0.1 ether; // 0.1 LINK (18 decimals)

        vm.startBroadcast(deployerPrivateKey);

        IERC20 link = IERC20(linkToken);

        // Check sender balance
        uint256 senderBalance = link.balanceOf(sender);
        console.log("Sender LINK balance:", senderBalance / 1e18, "LINK");

        require(senderBalance >= amountToSend, "Insufficient LINK balance");

        // Send LINK to executor
        bool success = link.transfer(executor, amountToSend);
        require(success, "LINK transfer failed");

        // Check executor balance after transfer
        uint256 executorBalance = link.balanceOf(executor);
        console.log(
            "Executor LINK balance after transfer:",
            executorBalance / 1e18,
            "LINK"
        );

        console.log("Successfully sent 0.1 LINK to CrossChainExecutor!");

        vm.stopBroadcast();
    }
}
