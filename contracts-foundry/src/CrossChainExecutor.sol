// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AdapterRegistry.sol";
import {IRouterClient} from "@chainlink/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * NOTE:
 * This is the latest version of CrossChainExecutor.sol.
 * Currently `tokenAmounts` is left as an empty array. If you want to enable token bridging, please update this part.
 * The `_ccipReceive` function is also left empty — please implement message handling logic as needed.
 */

contract CrossChainExecutor is CCIPReceiver, OwnerIsCreator {
    IRouterClient private immutable s_router;
    AdapterRegistry private immutable s_adapterRegistry;

    constructor(
        address _router,
        address _adapterRegistry
    ) CCIPReceiver(_router) {
        s_router = IRouterClient(_router);
        s_adapterRegistry = AdapterRegistry(_adapterRegistry);
    }

    // This function will be called by the CCIP router when receiving a cross-chain message.
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        // TODO: implement cross-chain message handling logic here
    }

    /**
     * Sends a cross-chain message to the destination chain.
     * Currently, tokenAmounts is sent as an empty array (no tokens bridged).
     * You can modify this to send tokens if needed.
     */
    function sendCrossChain(
        uint64 destinationChainSelector,
        address receiver,
        uint256 strategyId,
        bytes memory payload,
        address token,
        uint256 amount
    ) external payable returns (bytes32 messageId) {
        // Define an empty array of tokenAmounts — no tokens sent for now
        Client.EVMTokenAmount[] memory tokenAmounts;

        // Construct the cross-chain message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(strategyId, payload),
            tokenAmounts: tokenAmounts, // Empty array (no tokens bridged)
            extraArgs: Client._argsToBytes(
                Client.GenericExtraArgsV2({
                    gasLimit: 500_000,
                    allowOutOfOrderExecution: true
                })
            ),
            feeToken: address(0)
        });

        // Query fee required to send the message
        uint256 fee = s_router.getFee(destinationChainSelector, message);

        // Send the message via CCIP
        messageId = s_router.ccipSend{value: fee}(
            destinationChainSelector,
            message
        );

        // Emit event for tracking
        emit MessageSent(
            messageId,
            destinationChainSelector,
            receiver,
            strategyId,
            address(0),
            fee
        );
    }

    // Event emitted when a cross-chain message is sent
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        uint256 strategyId,
        address feeToken,
        uint256 fees
    );
}
