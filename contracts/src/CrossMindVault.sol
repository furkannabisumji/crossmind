// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrossMindVault is Ownable {
    address public token; // ✅ USDC token address to be passed in constructor
    address public strategyManager;

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
    event Unlock(address indexed user);
    event ProcessWithdraw(address indexed user, uint256 amount);
    event StrategyManagerUpdated(address indexed newStrategyManager);

    constructor(address _token, address _strategyManager) Ownable(msg.sender) {
        require(_token != address(0), "Token address cannot be zero");
        require(
            _strategyManager != address(0),
            "StrategyManager address cannot be zero"
        );

        token = _token; // 👈 هنا لازم تمرر عنوان USDC الصحيح
        strategyManager = _strategyManager;
    }

    modifier onlyStrategyManager() {
        require(msg.sender == strategyManager, "Not strategy manager");
        _;
    }

    mapping(address => Balance[]) public balances;

    function deposit(uint256 _amount, Risk _risk) external {
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        totalAmount += _amount;

        balances[msg.sender].push(
            Balance({amount: _amount, risk: _risk, locked: false})
        );

        emit Deposit(msg.sender, _amount);
    }

    function withdraw(uint256 _index) external {
        Balance storage balance = balances[msg.sender][_index];
        require(balance.amount > 0, "No balance");
        require(!balance.locked, "Vault is locked");

        uint256 amountToWithdraw = balance.amount;
        balance.amount = 0;
        totalAmount -= amountToWithdraw;

        IERC20(token).transfer(msg.sender, amountToWithdraw);

        emit Withdrawn(msg.sender, amountToWithdraw);
    }

    function removeBalance(
        address user,
        uint256 _index
    ) external onlyStrategyManager {
        balances[user][_index] = balances[user][balances[user].length - 1];
        balances[user].pop();
    }

    function lock(address user, uint256 _index) external onlyStrategyManager {
        balances[user][_index].locked = true;
        IERC20(token).transfer(strategyManager, balances[user][_index].amount);

        emit Lock(user);
    }

    function unlock(address user, uint256 _index) external onlyStrategyManager {
        balances[user][_index].locked = false;
        emit Unlock(user);
    }

    function getBalance(address user) external view returns (Balance[] memory) {
        return balances[user];
    }

    function balanceOf(address user) public view returns (uint256 total) {
        for (uint256 i = 0; i < balances[user].length; i++) {
            total += balances[user][i].amount;
        }
    }

    function totalBalance() external view returns (uint256) {
        return totalAmount;
    }

    function setStrategyManager(address _strategyManager) external onlyOwner {
        require(
            _strategyManager != address(0),
            "StrategyManager address cannot be zero"
        );
        strategyManager = _strategyManager;
        emit StrategyManagerUpdated(_strategyManager);
    }
}
