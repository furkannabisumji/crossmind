// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StrategyManager.sol";

contract AdapterRegistry {
    // Placeholder token address
    address public adapterToken;

    constructor(address _token) {
        adapterToken = _token;
    }

    function token() external view returns (address) {
        return adapterToken;
    }

    function withdraw(uint256 index) external {
        // Placeholder withdraw
    }

    function invest(
        StrategyManager.ChainDeposit[] memory deposits,
        uint256 index,
        uint256 amount
    ) external {
        // Placeholder invest
    }
}
