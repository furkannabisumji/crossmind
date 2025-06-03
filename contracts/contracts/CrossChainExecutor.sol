// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StrategyManager.sol";
import "./AdapterRegisty.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrossChainExecutor is CCIPReceiver, OwnerIsCreator {
    address private immutable i_staker;


    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); 
    error NothingToWithdraw(); 
    error FailedToWithdrawEth(address owner, address target, uint256 value); 
    
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        string action,
        address feeToken,
        uint256 fees
    );

    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender
    );

    bytes32 private s_lastReceivedMessageId; 
    string private s_lastReceivedText;
    address private sender;
    IRouterClient private s_router;
    IERC20 private s_token;
    IERC20 private s_linkToken;
    AdapterRegistry private s_adapterRegistry;
    StrategyManager private s_strategyManager;
    address private s_vault;

    constructor(address _router, address _link,address _sender,address _staker,address _token,address _adapterRegistry,address _strategyManager,address _vault) CCIPReceiver(_router) {
        s_router = IRouterClient(_router);
        s_linkToken = IERC20(_link);
        sender = _sender;
        i_staker = _staker;
        s_token = IERC20(_token);
        s_adapterRegistry = AdapterRegistry(_adapterRegistry);
        s_strategyManager = StrategyManager(_strategyManager);
        s_vault = _vault;
    }
   function sendMessageOrToken(
        uint64 destinationChainSelector,
        address receiver,
        string memory action,
        uint256 index,
        StrategyManager.Deposit[] memory deposits,
        uint256 amount
    ) external returns (bytes32 messageId) {
        require(sender == msg.sender, "Unauthorised");
        Client.EVMTokenAmount[] memory tokenAmounts;
        if (keccak256(bytes(action)) != keccak256(bytes("exitStrategyRequest"))) {
            tokenAmounts = new Client.EVMTokenAmount[](1);
            tokenAmounts[0] = Client.EVMTokenAmount({
                token: address(s_token),
                amount: amount
            });
            
            s_token.approve(address(s_router), amount);
        } else {
            tokenAmounts = new Client.EVMTokenAmount[](0);
        }
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(action,index, deposits, amount),
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.GenericExtraArgsV2({
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
            action,
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
        if (any2EvmMessage.destTokenAmounts[0].token != address(0)) {
            (bool success,) = i_staker.call(
                any2EvmMessage.data
            );
            require(success, "Staker call failed");
        }
        (string memory action,uint256 index, StrategyManager.Deposit[] memory deposits, uint256 amount) = abi.decode(any2EvmMessage.data, (string, uint256, StrategyManager.Deposit[], uint256));
        if (keccak256(bytes(action)) == keccak256(bytes("exitStrategyRequest"))) {
            s_adapterRegistry.withdraw(index);
        }
        if (keccak256(bytes(action)) == keccak256(bytes("exitStrategy"))) {
            IERC20(s_token).transfer(s_vault, amount);
            s_strategyManager.exitStrategy(any2EvmMessage.sourceChainSelector);
        }
        if (keccak256(bytes(action)) == keccak256(bytes("executeStrategy"))) {
            IERC20(s_token).transfer(address(s_adapterRegistry), amount);
            s_adapterRegistry.invest(deposits, index, amount);
        }
        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address))
        );
    }

    function withdrawToken(
        address _beneficiary,
        address _token
    ) public onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));

        if (amount == 0) revert NothingToWithdraw();

        IERC20(_token).transfer(_beneficiary, amount);
    }
}
