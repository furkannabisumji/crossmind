// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./StrategyManager.sol";

contract CrossMindVault is Ownable {
    address public token;
    StrategyManager public strategyManager;

    struct Balance {
        uint256 amount;
        bool locked;
    }
    
    uint256 public totalAmount;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Lock(address indexed user);
    event ProcessWithdraw(address indexed user, uint256 amount);
    constructor(address _token, address _strategyManager) {
        token = _token;
        strategyManager = StrategyManager(_strategyManager);
    }

    modifier onlyStrategyManager() {
        require(msg.sender == address(strategyManager), "Not strategy manager");
        _;
    }

    mapping(address =>mapping(address => Balance)) public balances;

    function deposit(uint256 _amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        totalAmount += _amount;
        balances[msg.sender][token].amount += _amount;
        emit Deposit(msg.sender, _amount);
    }

    function withdrawRequest(uint256 _amount) external {
        require(balances[msg.sender][token].amount >= _amount, "Not enough balance");
        require(!balances[msg.sender][token].locked, "Vault is locked");
        balances[msg.sender][token].amount -= _amount;
        totalAmount -= _amount;
        IERC20(token).transfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    function lock(address user) external onlyStrategyManager {
        balances[user][token].locked = true;
        emit Lock(user);
    }

    function processWithdraw(address user,uint256 _amount) external onlyStrategyManager {
        delete balances[user][token];
        totalAmount -= _amount;
        IERC20(token).transfer(user, _amount);
        emit ProcessWithdraw(user, _amount);
    }

    function getBalance(address user) external view returns (Balance memory) {
        return balances[user][token];
    }
}
