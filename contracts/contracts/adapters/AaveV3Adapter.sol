// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IStrategyAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IAaveV3Pool
 * @notice Interface for Aave V3 Pool
 */
interface IAaveV3Pool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

/**
 * @title AaveV3Adapter
 * @notice Adapter for Aave V3 protocol
 * @dev Implements the IStrategyAdapter interface for Aave V3
 */
contract AaveV3Adapter is IStrategyAdapter, Ownable {
    using SafeERC20 for IERC20;

    // Aave V3 Pool contract
    IAaveV3Pool public immutable aavePool;
    
    // Default referral code
    uint16 public referralCode = 0;

    // Events
    event Invested(address indexed token, uint256 amount, address indexed user);
    event Withdrawn(address indexed token, uint256 amount, address indexed user);
    event ReferralCodeUpdated(uint16 oldCode, uint16 newCode);

    /**
     * @notice Constructor
     * @param _aavePool Address of the Aave V3 Pool contract
     */
    constructor(address _aavePool) {
        require(_aavePool != address(0), "Invalid Aave pool address");
        aavePool = IAaveV3Pool(_aavePool);
    }

    /**
     * @notice Updates the referral code
     * @param _referralCode New referral code
     */
    function setReferralCode(uint16 _referralCode) external onlyOwner {
        emit ReferralCodeUpdated(referralCode, _referralCode);
        referralCode = _referralCode;
    }

    /**
     * @notice Invests tokens into Aave V3
     * @param amount Amount of tokens to invest
     * @param token Address of the token to invest
     * @return success Boolean indicating if the investment was successful
     */
    function invest(
        uint256 amount,
        address token
    ) external payable override returns (bool success) {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from sender to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve Aave pool to spend tokens
        IERC20(token).safeApprove(address(aavePool), amount);
        
        // Supply tokens to Aave
        aavePool.supply(token, amount, msg.sender, referralCode);
        
        emit Invested(token, amount, msg.sender);
        return true;
    }

    /**
     * @notice Withdraws tokens from Aave V3
     * @param amount Amount of tokens to withdraw
     * @param token Address of the token to withdraw
     * @return success Boolean indicating if the withdrawal was successful
     */
    function withdraw(
        uint256 amount,
        address token
    ) external override returns (bool success) {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Withdraw tokens from Aave
        uint256 withdrawnAmount = aavePool.withdraw(token, amount, msg.sender);
        
        emit Withdrawn(token, withdrawnAmount, msg.sender);
        return true;
    }

    /**
     * @notice Rescues tokens accidentally sent to this contract
     * @param token Address of the token to rescue
     * @param to Address to send the tokens to
     * @param amount Amount of tokens to rescue
     */
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot send to zero address");
        IERC20(token).safeTransfer(to, amount);
    }
}
