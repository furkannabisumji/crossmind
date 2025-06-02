// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IStrategyAdapter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CrossMindVault.sol";

/**
 * @title StrategyManager
 * @notice Manages investment strategies across different chains and protocols
 * @dev Coordinates with CrossChainExecutor to execute strategies
 */
contract StrategyManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    CrossMindVault public vault;
    struct Deposit {
        address adapter;
        uint256 percentage;
    }
    
    struct Strategy {
        uint64 chainId;
        Deposit[] deposits;
    }

    struct Protocol {
        string name;
        address adapter;
    }
    
    // Mapping from chainId to adapter addresses
    mapping(uint64 => Protocol[]) public protocols;

    // Mapping user to vault
    mapping(address => mapping(uint256 => Strategy[])) public vaults;

    // strategy count
    uint256 public strategyCount;
    
    // Supported chainIdd 
    uint64[] public supportedChainIds;
    
    // Events
    event StrategyExecuted(address user, uint256 amount);
    
    /**
     * @notice Executes a single strategy
     * @param strategy Array of strategies to execute
     */
    function executeStrategy(Strategy[] calldata strategy) external nonReentrant {
        CrossMindVault.Balance memory balance = vault.getBalance(msg.sender);
        uint256 totalPercentage = 0;
        require(!balance.locked, "Vault is locked");
        uint256[] memory uniqueChains = new uint256[](strategy.length);
        uint256 count;
        for (uint256 i = 0; i < strategy.length; i++) {
            require(isSupportedChainId(strategy[i].chainId), "Unsupported chain ID");
            for (uint256 j = 0; j < count; j++) {
                if (uniqueChains[j] == strategy[i].chainId) {
                    revert("Chains must be unique");
                }
            }
            uniqueChains[count] = strategy[i].chainId;
            count++;
            for (uint256 j = 0; j < strategy[i].deposits.length; j++) {
                require(strategy[i].deposits[j].percentage > 0, "Percentage must be greater than 0");
                require(isProtocol(strategy[i].chainId, strategy[i].deposits[j].adapter), "Adapter not registered");
                totalPercentage += strategy[i].deposits[j].percentage;
            }
        }
        require(totalPercentage == 100, "Total percentage must be 100");
        vault.lock(msg.sender);
        emit StrategyExecuted(msg.sender, balance.amount);
    }

    function addSupportedChainId(uint64 chainId) external onlyOwner {
        supportedChainIds.push(chainId);
    }

    function removeSupportedChainId(uint64 chainId) external onlyOwner {
        for (uint256 i = 0; i < supportedChainIds.length; i++) {
            if (supportedChainIds[i] == chainId) {
                supportedChainIds[i] = supportedChainIds[supportedChainIds.length - 1];
                supportedChainIds.pop();
                return;
            }
        }
    }

    function getSupportedChainIds() external view returns (uint64[] memory) {
        return supportedChainIds;
    }

    function addProtocol(uint64 chainId, string memory name, address adapter) external onlyOwner {
        protocols[chainId].push(Protocol(name, adapter));
    }

    function removeProtocol(uint64 chainId, address adapter) external onlyOwner {
        for (uint256 i = 0; i < protocols[chainId].length; i++) {
            if (protocols[chainId][i].adapter == adapter) {
                protocols[chainId][i] = protocols[chainId][protocols[chainId].length - 1];
                protocols[chainId].pop();
                return;
            }
        }
    }

    function getProtocols(uint64 chainId) external view returns (Protocol[] memory) {
        return protocols[chainId];
    }

    function isSupportedChainId(uint64 chainId) internal view returns (bool) {
        for (uint256 i = 0; i < supportedChainIds.length; i++) {
            if (supportedChainIds[i] == chainId) {
                return true;
            }
        }
        return false;
    }

    function isProtocol(uint64 chainId, address adapter) internal view returns (bool) {
        for (uint256 i = 0; i < protocols[chainId].length; i++) {
            if (protocols[chainId][i].adapter == adapter) {
                return true;
            }
        }
        return false;
    }
}
