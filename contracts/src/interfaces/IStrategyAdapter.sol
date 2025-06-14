// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStrategyAdapter
 * @author CrossMind Team
 * @notice Interface for DeFi protocol adapters used in CrossMind strategies
 * @dev All adapters (Aave, Lido, Curve, etc.) must implement this interface
 */
interface IStrategyAdapter {
    /**
     * @notice Invests funds into the underlying protocol
     * @dev The adapter must implement the logic to supply tokens into the protocol
     * @param amount Amount of tokens to invest
     * @param token Address of the token to invest
     * @return success Boolean indicating if the investment was successful
     */
    function invest(
        uint256 amount,
        address token
    ) external payable returns (bool success);

    /**
     * @notice Withdraws funds from the underlying protocol
     * @dev The adapter must implement the logic to withdraw tokens from the protocol
     * @param amount Amount of tokens to withdraw
     * @param token Address of the token to withdraw
     * @return success Boolean indicating if the withdrawal was successful
     */
    function withdraw(
        uint256 amount,
        address token
    ) external returns (bool success);
}
