// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StrategyManager.sol";

contract AdapterRegistry {
    // Placeholder token address
    address public adapterToken;

    // Track balances per index for test visibility
    mapping(uint256 => uint256) public investedAmount;
    mapping(uint256 => bool) public withdrawn;

    event Invested(uint256 indexed index, uint256 amount);
    event Withdrawn(uint256 indexed index, uint256 amount);

    constructor(address _token) {
        adapterToken = _token;
    }

    function token() external view returns (address) {
        return adapterToken;
    }

    function withdraw(uint256 index) external {
        require(investedAmount[index] > 0, "Nothing to withdraw");
        uint256 amount = investedAmount[index];
        withdrawn[index] = true;
        investedAmount[index] = 0;

        emit Withdrawn(index, amount);
    }

    function invest(
        StrategyManager.ChainDeposit[] memory deposits,
        uint256 index,
        uint256 amount
    ) external {
        // For test purposes, we just store the amount
        investedAmount[index] += amount;

        emit Invested(index, amount);
    }
}
