// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";

contract CrossChainExecutor is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); 
    error NothingToWithdraw(); 
    error FailedToWithdrawEth(address owner, address target, uint256 value); 
    
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        bytes text,
        address feeToken,
        uint256 fees
    );

    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        string text 
    );

    bytes32 private s_lastReceivedMessageId; 
    string private s_lastReceivedText;
    address private sender;
    IRouterClient private s_router;
    IERC20 private s_linkToken;

    constructor(address _router, address _link,address _sender) CCIPReceiver(_router) {
        s_router = IRouterClient(_router);
        s_linkToken = IERC20(_link);
        sender = _sender;
    }
   function sendMessageOrToken(
        uint64 destinationChainSelector,
        address receiver,
        bytes memory text,
        address token,
        uint256 amount
    ) external returns (bytes32 messageId) {
        require(sender == msg.sender, "Unauthorised");
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: text,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV2({
                    gasLimit: 400_000,
                    allowOutOfOrderExecution: true
                })
            ),
            feeToken: address(0)
        });

        uint256 fee = s_router.getFee(destinationChainSelector, message);

        bytes32 messaged = s_router.ccipSend{value: fee}(
            destinationChainSelector,
            message
        );

        emit MessageSent(
            messaged,
            destinationChainSelector,
            receiver,
            text,
            address(0),
            fee
        );

        return messaged;
    }
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    )
        internal
        override
    {
        s_lastReceivedMessageId = any2EvmMessage.messageId;
        s_lastReceivedText = abi.decode(any2EvmMessage.data, (string));

        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            abi.decode(any2EvmMessage.data, (string))
        );
    }

    function withdrawToken(
        address _beneficiary,
        address _token
    ) public onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));

        if (amount == 0) revert NothingToWithdraw();

        IERC20(_token).safeTransfer(_beneficiary, amount);
    }
}
