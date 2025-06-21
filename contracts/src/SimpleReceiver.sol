// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

/**
 * @title SimpleReceiver
 * @notice This contract receives cross-chain messages via Chainlink CCIP.
 */
contract SimpleReceiver is CCIPReceiver {
    event MessageReceived(uint256 strategyId, bytes payload);

    // Optional: store last received message data
    uint256 public lastStrategyId;
    bytes public lastPayload;

    constructor(address _router) CCIPReceiver(_router) {}

    /**
     * @notice Called automatically by CCIP Router on message delivery.
     * @param message The incoming message with strategyId and payload encoded.
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        (uint256 strategyId, bytes memory payload) = abi.decode(
            message.data,
            (uint256, bytes)
        );

        // Store for retrieval (optional)
        lastStrategyId = strategyId;
        lastPayload = payload;

        emit MessageReceived(strategyId, payload);
    }
}
