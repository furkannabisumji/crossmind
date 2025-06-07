// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CrossMindVault.sol";
import "./CrossChainExecutor.sol";

/**
 * @title StrategyManager
 * @notice Manages investment strategies across different chains and protocols
 * @dev Coordinates with CrossChainExecutor to execute strategies
 */
contract StrategyManager is Ownable, ReentrancyGuard {
    
    CrossMindVault public vault;
    CrossChainExecutor public executor;
    struct Deposit {
        address adapter;
        uint256 percentage;
    }
    
    struct Strategy {
        uint64 chainId;
        uint256 index;
        Deposit[] deposits;
    }

    struct ExecutedStrategy {
        uint256 index;
        uint64 chainId;
        bool exited;
        uint256 amount;
    }

    struct Protocol {
        string name;
        address adapter;
    }

    struct Chain {
        address receiver;
    }
    
    // Separate mapping for protocols to avoid array copying issues
    mapping(uint64 => Protocol[]) public chainProtocols;
    
    // Mapping from chainId to adapter addresses
    mapping(uint64 => Chain) public chains;

    // Mapping user to vault
    mapping(address => ExecutedStrategy[]) public vaults;

    // Events
    event StrategyExecuted(address user, uint256 amount);
    event AddressesUpdated(address indexed vault, address indexed executor);

    function initialize(address _vault, address _executor) external onlyOwner {
        require(address(vault) == address(0) && address(executor) == address(0), "Already initialized");
        vault = CrossMindVault(_vault);
        executor = CrossChainExecutor(_executor);
        emit AddressesUpdated(_vault, _executor);
    }
    
    /**
     * @notice Executes a single strategy
     * @param strategy Array of strategies to execute
     * @param index Index of the balance to use
     */
    function executeStrategy(Strategy[] calldata strategy, uint256 index) external nonReentrant {
        // Get user balance and validate it
        CrossMindVault.Balance memory balance = vault.getBalance(msg.sender)[index];
        require(!balance.locked, "Vault is locked");
        require(balance.amount > 0, "No balance");
        
        // Validate strategy configuration
        validateStrategy(strategy);
        
        // Lock the vault to prevent withdrawals during strategy execution
        IERC20(vault.token()).transfer(address(executor), balance.amount);
        vault.lock(msg.sender, index);
        
        // Execute strategy for each chain
        for (uint256 i = 0; i < strategy.length; i++) {
            // Calculate amount for this chain based on percentages
            uint256 chainAmount = calculateChainAmount(strategy[i], balance.amount);
            
            // Send cross-chain message with strategy data and amount
            executor.sendMessageOrToken(
                strategy[i].chainId,
                chains[strategy[i].chainId].receiver,
                "executeStrategy",
                strategy[i].index,
                strategy[i].deposits,
                chainAmount
            );
            vaults[msg.sender].push(ExecutedStrategy({
                chainId: strategy[i].chainId,
                index: strategy[i].index,
                exited: false,
                amount: chainAmount
            }));
        }
        
        emit StrategyExecuted(msg.sender, balance.amount);
    }

    function exitStrategyRequest(uint256 index) external nonReentrant {
        ExecutedStrategy memory strategy = vaults[msg.sender][index];
        require(strategy.chainId > 0, "No strategy");
        executor.sendMessageOrToken(
            strategy.chainId,
            chains[strategy.chainId].receiver,
            "exitStrategyRequest",
            strategy.index,
            new Deposit[](0),
            strategy.amount
        );
        
    }

    function exitStrategy(uint64 chainId) external {
        require(address(executor) == msg.sender, "Not executor");
        ExecutedStrategy[] memory strategies = vaults[msg.sender];
        uint256 strategyIndex = 0;
        bool found = false;
        
        // Find the strategy with the matching chainId
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].chainId == chainId) {
                strategies[i].exited = true;
                strategyIndex = strategies[i].index;
                found = true;
                break;
            }
        }
        
        require(found, "Strategy not found");
        
        // Check if all strategies are exited
        bool allExited = true;
        for (uint256 i = 0; i < strategies.length; i++) {
            if (!strategies[i].exited) {
                allExited = false;
                break;
            }
        }
        
        // If all strategies are exited, remove the balance from the vault
        if (allExited) {
            vault.removeBalance(strategyIndex);
        }
    }   
    
    /**
     * @notice Validates the strategy configuration
     * @param strategy Array of strategies to validate
     */
    function validateStrategy(Strategy[] calldata strategy) internal view {
        uint256 totalPercentage = 0;
        uint256[] memory uniqueChains = new uint256[](strategy.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < strategy.length; i++) {
            // Validate chain is supported
            require(isSupportedChainId(strategy[i].chainId), "Unsupported chain ID");
            
            // Check for duplicate chains
            for (uint256 j = 0; j < count; j++) {
                if (uniqueChains[j] == strategy[i].chainId) {
                    revert("Chains must be unique");
                }
            }
            uniqueChains[count++] = strategy[i].chainId;
            
            // Validate deposits for this chain
            for (uint256 j = 0; j < strategy[i].deposits.length; j++) {
                require(strategy[i].deposits[j].percentage > 0, "Percentage must be greater than 0");
                require(isProtocol(strategy[i].chainId, strategy[i].deposits[j].adapter), "Adapter not registered");
                totalPercentage += strategy[i].deposits[j].percentage;
            }
        }
        
        require(totalPercentage == 100, "Total percentage must be 100");
    }
    
    /**
     * @notice Calculates the amount to send to a specific chain
     * @param chainStrategy Strategy for a specific chain
     * @param totalAmount Total amount available for the strategy
     * @return Amount to send to this chain
     */
    function calculateChainAmount(Strategy calldata chainStrategy, uint256 totalAmount) internal pure returns (uint256) {
        uint256 chainPercentage = 0;
        for (uint256 i = 0; i < chainStrategy.deposits.length; i++) {
            chainPercentage += chainStrategy.deposits[i].percentage;
        }
        
        return (totalAmount * chainPercentage) / 100;
    }

    /**
     * @notice Add a supported chain ID with its receiver address
     * @param chainId Chain ID to add support for
     * @param receiver Address of the receiver contract on the target chain
     */
    function addSupportedChainId(uint64 chainId, address receiver) external onlyOwner {
        require(!isSupportedChainId(chainId), "Chain ID already supported");
        chains[chainId] = Chain({
            receiver: receiver
        });
        // No need to initialize the protocols array as it's now in a separate mapping
    }

    function removeSupportedChainId(uint64 chainId) external onlyOwner {
        delete chains[chainId];
    }
    function addProtocol(uint64 chainId, string memory name, address adapter) external onlyOwner {
        require(isSupportedChainId(chainId), "Chain ID not supported");
        chainProtocols[chainId].push(Protocol({
            name: name,
            adapter: adapter
        }));
    }

    function removeProtocol(uint64 chainId, address adapter) external onlyOwner {
        for (uint256 i = 0; i < chainProtocols[chainId].length; i++) {
            if (chainProtocols[chainId][i].adapter == adapter) {
                chainProtocols[chainId][i] = chainProtocols[chainId][chainProtocols[chainId].length - 1];
                chainProtocols[chainId].pop();
                return;
            }
        }
    }

    function token() external view returns (address) {
        return vault.token();
    }

    function getProtocols(uint64 chainId) external view returns (Protocol[] memory) {
        return chainProtocols[chainId];
    }

    function isSupportedChainId(uint64 chainId) internal view returns (bool) {
        return chains[chainId].receiver != address(0);
    }

    function isProtocol(uint64 chainId, address adapter) internal view returns (bool) {
        for (uint256 i = 0; i < chainProtocols[chainId].length; i++) {
            if (chainProtocols[chainId][i].adapter == adapter) {
                return true;
            }
        }
        return false;
    }

    function getVaults(address user) public view returns (ExecutedStrategy[] memory) {
        return vaults[user];
    }
}
