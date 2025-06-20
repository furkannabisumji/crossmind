// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/CrossChainExecutor.sol";
import "../src/AdapterRegistry.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

// MockRouter to mock IRouterClient
contract MockRouter is IRouterClient {
    function getFee(
        uint64,
        Client.EVM2AnyMessage memory
    ) external pure override returns (uint256) {
        return 0.01 ether; // Return dummy fee
    }

    function ccipSend(
        uint64,
        Client.EVM2AnyMessage calldata
    ) external payable override returns (bytes32) {
        return keccak256("mockMessageId"); // Return dummy messageId
    }

    function isChainSupported(uint64) external pure override returns (bool) {
        return true;
    }
}

contract CrossChainExecutorTest is Test {
    CrossChainExecutor crossChainExecutor;
    MockRouter mockRouter;
    AdapterRegistry adapterRegistry;

    address owner = address(this); // Set test contract as owner

    function setUp() public {
        // Deploy mocks
        mockRouter = new MockRouter();
        adapterRegistry = new AdapterRegistry(address(this)); // Pass correct argument here!

        // Deploy CrossChainExecutor
        crossChainExecutor = new CrossChainExecutor(
            address(mockRouter),
            address(adapterRegistry)
        );
    }

    function testSendCrossChainEmitsMessageSent() public {
        // Arrange
        uint64 destinationChainSelector = 12345;
        address receiver = address(0x1234);
        uint256 strategyId = 1;
        bytes memory payload = "testPayload";
        address token = address(0x5678);
        uint256 amount = 0;

        // Expect event to be emitted
        vm.expectEmit(true, true, true, true);
        emit CrossChainExecutor.MessageSent(
            keccak256("mockMessageId"), // mock messageId
            destinationChainSelector,
            receiver,
            strategyId,
            address(0),
            0.01 ether
        );

        // Act
        crossChainExecutor.sendCrossChain{value: 0.01 ether}(
            destinationChainSelector,
            receiver,
            strategyId,
            payload,
            token,
            amount
        );
    }
}
