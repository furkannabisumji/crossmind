// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStrategyAdapter.sol";
import "./StrategyManager.sol";
import "./CrossChainExecutor.sol";

contract AdapterRegistry is Ownable {
    address[] public adapters;
    address immutable receiver;
    uint64 immutable chainId;
    address public token;
    CrossChainExecutor public executor;

    struct Balance {
        address adapter;
        uint256 amount;
    }
    
    mapping(uint256 => Balance[]) public balances;

    event AdapterAdded(address indexed adapter);
    event AdapterRemoved(address indexed adapter);
    event Withdrawn(address indexed user, uint256 amount);
    modifier onlyExecutor() {
        require(msg.sender == address(executor), "Not executor");
        _;
    }
    constructor(address _token, address _executor, address _receiver, uint64 _chainId) {
        token = _token;
        executor = CrossChainExecutor(_executor);
        receiver = _receiver;
        chainId = _chainId;
    }
    function invest(StrategyManager.Deposit[] memory _deposits, uint256 _index, uint256 _amount) external onlyExecutor {
        for (uint256 i = 0; i < _deposits.length; i++) {
            require(isAdapter(_deposits[i].adapter), "Adapter not registered");
            uint256 amount = (_amount * _deposits[i].percentage) / 100;
            IStrategyAdapter(_deposits[i].adapter).invest(amount, token);
            balances[_index].push(Balance({
                adapter: _deposits[i].adapter,
                amount: amount
            }));
        }
    }

    function withdraw(uint256 _index) external onlyExecutor {
        require(balances[_index].length > 0, "No balance");
        uint256 amount;
        Balance[] memory userBalances = getBalance(_index);
        for (uint256 i = 0; i < userBalances.length; i++) {
            amount += userBalances[i].amount;
            IStrategyAdapter(userBalances[i].adapter).withdraw(userBalances[i].amount, token);
        }
        IERC20(token).transfer(address(executor), amount);
        executor.sendMessageOrToken(
            chainId,
            receiver,
            "withdraw",
            _index,
            new StrategyManager.Deposit[](0),
            amount
        );
        delete balances[_index];
        emit Withdrawn(msg.sender, amount);
    }

    function addAdapter(address _adapter) external onlyOwner {
        adapters.push(_adapter);
        emit AdapterAdded(_adapter);
    }

    function removeAdapter(address _adapter) external onlyOwner {
        for (uint256 i = 0; i < adapters.length; i++) {
            if (adapters[i] == _adapter) {
                adapters[i] = adapters[adapters.length - 1];
                adapters.pop();
                emit AdapterRemoved(_adapter);
                return;
            }
        }
    }

    function getAdapters() external view returns (address[] memory) {
        return adapters;
    }

    function isAdapter(address _adapter) public view returns (bool) {
        for (uint256 i = 0; i < adapters.length; i++) {
            if (adapters[i] == _adapter) {
                return true;
            }
        }
        return false;
    }

    function getBalance(uint256 _index) public view returns (Balance[] memory) {
        return balances[_index];
    }
}