// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AdapterRegistry.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * CrossChainExecutor contract handles cross-chain messaging via Chainlink CCIP.
 * NOTE: `tokenAmounts` is currently left as an empty array (no token bridging).
 * To support token transfers, extend logic to populate tokenAmounts accordingly.
 */

contract CrossChainExecutor is CCIPReceiver, OwnerIsCreator {
    IRouterClient private immutable s_router;
    AdapterRegistry private immutable s_adapterRegistry;

    constructor(
        address _router,
        address _adapterRegistry
    ) CCIPReceiver(_router) {
        require(_router != address(0), "Router address cannot be zero");
        require(
            _adapterRegistry != address(0),
            "AdapterRegistry address cannot be zero"
        );

        s_router = IRouterClient(_router);
        s_adapterRegistry = AdapterRegistry(_adapterRegistry);
    }

    // Handles incoming CCIP messages. Must be implemented per app logic.
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        // TODO: implement message decoding and execution
        // Example:
        // (uint256 strategyId, bytes memory payload) = abi.decode(any2EvmMessage.data, (uint256, bytes));
    }

    /**
     * Sends a cross-chain message via Chainlink CCIP.
     * Currently tokenAmounts is empty — no tokens are bridged.
     */
    function sendCrossChain(
        uint64 destinationChainSelector,
        address receiver,
        uint256 strategyId,
        bytes memory payload,
        address token,
        uint256 amount
    ) external payable returns (bytes32 messageId) {
        require(
            token != address(s_adapterRegistry),
            "Invalid token address: AdapterRegistry used instead of USDC"
        );

        emit DebugLog("Before getFee");
        Client.EVMTokenAmount[] memory tokenAmounts;
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

        uint256 fee = s_router.getFee(destinationChainSelector, message);
        emit DebugLog("After getFee");

        // Try/catch for ccipSend
        emit DebugLog("Before ccipSend");
        (bool success, bytes memory result) = address(s_router).call{
            value: fee
        }(
            abi.encodeWithSelector(
                s_router.ccipSend.selector,
                destinationChainSelector,
                message
            )
        );
        emit DebugLog("After ccipSend");
        require(success, string(abi.encodePacked("ccipSend failed: ", result)));
        messageId = abi.decode(result, (bytes32));

        emit MessageSent(
            messageId,
            destinationChainSelector,
            receiver,
            strategyId,
            address(0),
            fee
        );
    }

    /**
     * Interface function expected by StrategyManager.
     * Maps to sendCrossChain with appropriate parameter mapping.
     */
    function sendMessageOrToken(
        uint64 destinationChainSelector,
        address receiver,
        string calldata action,
        uint256 index,
        bytes calldata deposits,
        uint256 amount
    ) external returns (bytes32) {
        // Encode the action and index as payload
        bytes memory payload = abi.encode(action, index, deposits);

        // For now, we'll use address(0) as token since we're not bridging tokens yet
        // In the future, this could be the USDC token address
        return
            this.sendCrossChain(
                destinationChainSelector,
                receiver,
                index,
                payload,
                address(0), // token address
                amount
            );
    }

    /// Emitted when a cross-chain message is sent
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        uint256 strategyId,
        address feeToken,
        uint256 fees
    );

    event DebugLog(string message);

    /**
     * Getter function to access the router address
     */
    function router() external view returns (address) {
        return address(s_router);
    }

    /**
     * Allow the contract to receive AVAX/ETH for CCIP fees
     */
    receive() external payable {
        // Accept any incoming AVAX/ETH
    }
}
