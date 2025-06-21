// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {CrossChainExecutor} from "../src/CrossChainExecutor.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

contract SendCrossChainMessageScript is Script {
    event SentMessageId(bytes32 messageId);

    function run() external {
        address executorAddr = vm.envAddress("CROSS_CHAIN_EXECUTOR");
        address routerAddr = vm.envAddress("CCIP_ROUTER");
        address receiver = vm.envAddress("DESTINATION_RECEIVER");

        uint64 dstSelector = 12532609583862916517; // Sepolia
        uint256 strategyId = 1;
        bytes memory payload = "";
        address token = address(0);
        uint256 amount = 0;

        // Empty tokenAmounts array
        Client.EVMTokenAmount;

        // Construct the message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(strategyId, payload),
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.GenericExtraArgsV2({
                    gasLimit: 500_000,
                    allowOutOfOrderExecution: true
                })
            ),
            feeToken: address(0)
        });

        // Calculate the CCIP fee
        uint256 fee = IRouterClient(routerAddr).getFee(dstSelector, message);

        vm.startBroadcast();
        bytes32 messageId = CrossChainExecutor(executorAddr).sendCrossChain{
            value: fee
        }(dstSelector, receiver, strategyId, payload, token, amount);
        emit SentMessageId(messageId);
        vm.stopBroadcast();
    }
}
