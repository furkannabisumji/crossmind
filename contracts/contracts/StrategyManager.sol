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
    struct AdapterDeposit {
        address adapter;
        uint256 percentage;
    }

    struct ChainDeposit {
        uint64 chainId;
        uint256 amount;
        AdapterDeposit[] deposits;
    }
    enum Status {
        PENDING,
        REGISTERED,
        EXECUTED,
        REJECTED,
        EXITED
    }
    struct Strategy {
        uint256 index;
        Status status;
        uint256 amount;
        ChainDeposit[] deposits;
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

    // Mapping user to strategies
    mapping(address => Strategy[]) public vaults;

    // Events
    event StrategyRegistered(address user, uint256 amount, uint256 index);
    event StrategyExecuted(address user, uint256 amount, uint256 index, bool accepted);
    event AddressesUpdated(address indexed vault, address indexed executor);

    function initialize(address _vault, address _executor) external onlyOwner {
        require(address(vault) == address(0) && address(executor) == address(0), "Already initialized");
        vault = CrossMindVault(_vault);
        executor = CrossChainExecutor(_executor);
        emit AddressesUpdated(_vault, _executor);
    }
    
    /**
     * @notice Registers a strategy by the AI agent for the user to execute
     * @param strategy Strategy to execute
     * @param index Index of the balance to use
     */
    function registerStrategy(Strategy calldata strategy, uint256 index) external onlyOwner {
        // Get user balance and validate it
        CrossMindVault.Balance memory balance = vault.getBalance(msg.sender)[index];
        require(!balance.locked, "Vault is locked");
        require(balance.amount > 0, "No balance");
        
        // Validate strategy configuration
        validateStrategy(strategy);
        
        // Calculate amounts for each chain deposit based on percentages
        ChainDeposit[] memory calculatedDeposits = new ChainDeposit[](strategy.deposits.length);
        
        for (uint256 i = 0; i < strategy.deposits.length; i++) {
            ChainDeposit memory chainDeposit = strategy.deposits[i];
            
            // Calculate the total amount for this chain
            uint256 chainAmount = calculateChainAmount(chainDeposit, balance.amount);
            
            // Store the calculated deposit with updated amount
            calculatedDeposits[i] = ChainDeposit({
                chainId: chainDeposit.chainId,
                amount: chainAmount,
                deposits: chainDeposit.deposits
            });
        }
        
        // Store the strategy in the user's vault
        vaults[msg.sender].push(Strategy(
            index,
            Status.REGISTERED,
            balance.amount,
            calculatedDeposits
        ));
        
        emit StrategyRegistered(msg.sender, balance.amount, index);
    }

    /**
     * @notice Confirms a strategy
     * @param index Index of the strategy to confirm
     * @param accepted Whether the strategy was accepted or rejected
     */
    function confirmStrategy(uint256 index, bool accepted) external nonReentrant {
        Strategy memory strategy = vaults[msg.sender][index];
        require(strategy.status == Status.REGISTERED, "Strategy not registered");
        if (!accepted) {
            strategy.status = Status.REJECTED;
            emit StrategyExecuted(msg.sender, strategy.amount, index, false);
            return;
        }

        // Get user balance and validate it
        CrossMindVault.Balance memory balance = vault.getBalance(msg.sender)[index];
        require(!balance.locked, "Vault is locked");
        require(balance.amount > 0, "No balance");
        
        // Lock the vault to prevent withdrawals during strategy execution
        IERC20(vault.token()).transfer(address(executor), balance.amount);
        vault.lock(msg.sender, index);
        
        // Execute strategy for each chain
        for (uint256 i = 0; i < strategy.deposits.length; i++) {
            // Calculate amount for this chain based on percentages
            uint256 chainAmount = calculateChainAmount(strategy.deposits[i], balance.amount);
            
            // Send cross-chain message with strategy data and amount
            executor.sendMessageOrToken(
                strategy.deposits[i].chainId,
                chains[strategy.deposits[i].chainId].receiver,
                "executeStrategy",
                index,
                strategy.deposits,
                chainAmount
            );
            vaults[msg.sender][index].status = Status.EXECUTED;
        }
        
        emit StrategyExecuted(msg.sender, strategy.amount, index, true);
    }

    function exitStrategyRequest(uint256 index) external nonReentrant {
        Strategy memory strategy = vaults[msg.sender][index];
        require(strategy.status == Status.EXECUTED, "Strategy not executed");
        for (uint256 i = 0; i < strategy.deposits.length; i++) {
            executor.sendMessageOrToken(
                strategy.deposits[i].chainId,
                chains[strategy.deposits[i].chainId].receiver,
                "exitStrategyRequest",
                strategy.index,
                new ChainDeposit[](0),
                strategy.amount
            );
        }
    }

    function exitStrategy(uint64 chainId) external {
        require(address(executor) == msg.sender, "Not executor");
        Strategy[] memory strategies = vaults[msg.sender];
        uint256 strategyIndex = 0;
        bool found = false;
        
        // Find the strategy with the matching chainId
        for (uint256 i = 0; i < strategies.length; i++) {
            for (uint256 j = 0; j < strategies[i].deposits.length; j++) {
                if (strategies[i].deposits[j].chainId == chainId) {
                    strategies[i].status = Status.EXITED;
                    strategyIndex = strategies[i].index;
                    found = true;
                    break;
                }
            }
        }
        
        require(found, "Strategy not found");
        
        // Check if all strategies are exited
        bool allExited = true;
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].status != Status.EXITED) {
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
     * @param strategy Strategy to validate
     */
    function validateStrategy(Strategy calldata strategy) internal view {
        uint256 totalPercentage = 0;
        uint256[] memory uniqueChains = new uint256[](strategy.deposits.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < strategy.deposits.length; i++) {
            // Validate deposits for this chain
            for (uint256 j = 0; j < strategy.deposits[i].deposits.length; j++) {
                ChainDeposit memory chainDeposit = strategy.deposits[i];
                
            // Validate chain is supported
            require(isSupportedChainId(chainDeposit.chainId), "Unsupported chain ID");
            
            // Check for duplicate chains
            for (uint256 k = 0; k < count; k++) {
                if (uniqueChains[k] == chainDeposit.chainId) {
                    revert("Chains must be unique");
                }
            }
            uniqueChains[count++] = chainDeposit.chainId;
            
                // Loop through all adapter deposits for this chain
                for (uint256 k = 0; k < chainDeposit.deposits.length; k++) {
                    AdapterDeposit memory adapterDeposit = chainDeposit.deposits[k];
                    require(adapterDeposit.percentage > 0, "Percentage must be greater than 0");
                    require(isProtocol(chainDeposit.chainId, adapterDeposit.adapter), "Adapter not registered");
                    totalPercentage += adapterDeposit.percentage;
                }
            }
        }        
        require(totalPercentage == 100, "Total percentage must be 100");
    }
    
    /**
     * @notice Calculates the amount to send to a specific chain based on adapter percentages
     * @param chainDeposit The chain deposit containing adapter allocations
     * @param totalAmount Total amount available for the strategy
     * @return Amount to send to this chain based on the percentage allocation
     */
    function calculateChainAmount(ChainDeposit memory chainDeposit, uint256 totalAmount) internal pure returns (uint256) {
        uint256 chainPercentage = 0;
        
        // Sum up all adapter percentages for this chain
        for (uint256 i = 0; i < chainDeposit.deposits.length; i++) {
            chainPercentage += chainDeposit.deposits[i].percentage;
        }
        
        // Calculate the amount based on the total percentage allocated to this chain
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

    function getVaults(address user) public view returns (Strategy[] memory) {
        return vaults[user];
    }
}
