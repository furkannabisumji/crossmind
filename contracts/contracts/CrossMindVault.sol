// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StrategyManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrossMindVault is Ownable {
    address public constant token = 0x5425890298aed601595a70AB815c96711a31Bc65;
    StrategyManager public strategyManager;

    enum Risk {
        LOW,
        MEDIUM,
        HIGH
    }
    struct Balance {
        uint256 amount;
        Risk risk;
        bool locked;
    }
    
    uint256 public totalAmount;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Lock(address indexed user);
    event ProcessWithdraw(address indexed user, uint256 amount);
    constructor(address _strategyManager) {
        strategyManager = StrategyManager(_strategyManager);
    }

    modifier onlyStrategyManager() {
        require(msg.sender == address(strategyManager), "Not strategy manager");
        _;
    }

    mapping(address => Balance[]) public balances;

    function deposit(uint256 _amount, Risk _risk) external {
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        totalAmount += _amount;
        balances[msg.sender].push(Balance({
            amount: _amount,
            risk: _risk,
            locked: false
        }));
        emit Deposit(msg.sender, _amount);
    }

    function withdraw(uint256 _index) external {
        Balance memory balance = balances[msg.sender][_index];
        require(balance.amount > 0, "No balance");
        require(!balance.locked, "Vault is locked");
        IERC20(token).transfer(msg.sender, balance.amount);
        totalAmount -= balance.amount;
        balance.amount = 0;
        emit Withdrawn(msg.sender, balance.amount);
    }

    function removeBalance(uint256 _index) external onlyStrategyManager {
        balances[msg.sender][_index] = balances[msg.sender][balances[msg.sender].length - 1];
        balances[msg.sender].pop();
    }

    function lock(address user, uint256 _index) external onlyStrategyManager {
        balances[user][_index].locked = true;
        IERC20(token).transfer(address(strategyManager), balances[user][_index].amount);
        emit Lock(user);
    }

    function getBalance(address user) external view returns (Balance[] memory) {
        return balances[user];
    }
}
