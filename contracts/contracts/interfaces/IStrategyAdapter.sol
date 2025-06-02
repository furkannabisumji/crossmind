// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStrategyAdapter
 * @notice Interface for DeFi protocol adapters
 * @dev All protocol adapters must implement this interface
 */
interface IStrategyAdapter {
    /**
     * @notice Invests funds into the underlying protocol
     * @param amount Amount of tokens to invest
     * @param token Address of the token to invest
     * @return success Boolean indicating if the investment was successful
     */
    function invest(uint256 amount, address token) external payable returns (bool success);

    /**
     * @notice Withdraws funds from the underlying protocol
     * @param amount Amount of tokens to withdraw
     * @param token Address of the token to withdraw
     * @return success Boolean indicating if the withdrawal was successful
     */
    function withdraw(uint256 amount, address token) external returns (bool success);
}
