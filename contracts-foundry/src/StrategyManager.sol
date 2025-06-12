// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICrossMindVault {
    struct Balance {
        uint256 amount;
        uint8 risk;
        bool locked;
    }

    function getBalance(address user) external view returns (Balance[] memory);

    function removeBalance(address user, uint256 index) external;

    function lock(address user, uint256 index) external;

    function unlock(address user, uint256 index) external;

    function token() external view returns (address);
}

interface ICrossChainExecutor {
    function sendMessageOrToken(
        uint64 destinationChainSelector,
        address receiver,
        string calldata action,
        uint256 index,
        bytes calldata deposits,
        uint256 amount
    ) external returns (bytes32);
}

contract StrategyManager is Ownable, ReentrancyGuard {
    address public vault;
    address public executor;

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

    mapping(uint64 => Protocol[]) public chainProtocols;
    mapping(uint64 => Chain) public chains;
    mapping(address => Strategy[]) public vaults;

    event StrategyRegistered(
        address indexed user,
        uint256 amount,
        uint256 index
    );
    event StrategyExecuted(
        address indexed user,
        uint256 amount,
        uint256 index,
        bool accepted
    );
    event StrategyExited(address indexed user, uint256 index);
    event ExitStrategyRequested(address indexed user, uint256 index);
    event TriggerRebalance(address indexed user, uint256 index);
    event AddressesUpdated(address indexed vault, address indexed executor);

    constructor(address _vault, address _executor) {
        vault = _vault;
        executor = _executor;
        emit AddressesUpdated(_vault, _executor);
    }

    function registerStrategy(
        Strategy calldata strategy,
        uint256 index
    ) external nonReentrant {
        ICrossMindVault.Balance memory balance = ICrossMindVault(vault)
            .getBalance(msg.sender)[index];
        require(!balance.locked, "Vault is locked");
        require(balance.amount > 0, "No balance");

        validateStrategy(strategy);

        vaults[msg.sender].push();
        Strategy storage newStrategy = vaults[msg.sender][
            vaults[msg.sender].length - 1
        ];
        newStrategy.index = index;
        newStrategy.status = Status.REGISTERED;
        newStrategy.amount = balance.amount;

        for (uint256 i = 0; i < strategy.deposits.length; i++) {
            ChainDeposit memory chainDeposit = strategy.deposits[i];
            uint256 chainAmount = calculateChainAmount(
                chainDeposit,
                balance.amount
            );

            ChainDeposit storage newChainDeposit = newStrategy.deposits.push();
            newChainDeposit.chainId = chainDeposit.chainId;
            newChainDeposit.amount = chainAmount;

            for (uint256 j = 0; j < chainDeposit.deposits.length; j++) {
                newChainDeposit.deposits.push(chainDeposit.deposits[j]);
            }
        }

        emit StrategyRegistered(msg.sender, balance.amount, index);
    }

    function confirmStrategy(
        uint256 index,
        bool accepted
    ) external nonReentrant {
        Strategy storage strategy = vaults[msg.sender][index];
        require(
            strategy.status == Status.REGISTERED,
            "Strategy not registered"
        );

        if (!accepted) {
            strategy.status = Status.REJECTED;
            emit StrategyExecuted(msg.sender, strategy.amount, index, false);
            return;
        }

        ICrossMindVault.Balance memory balance = ICrossMindVault(vault)
            .getBalance(msg.sender)[index];
        require(!balance.locked, "Vault is locked");
        require(balance.amount > 0, "No balance");

        ICrossMindVault(vault).lock(msg.sender, index);

        for (uint256 i = 0; i < strategy.deposits.length; i++) {
            uint256 chainAmount = calculateChainAmount(
                strategy.deposits[i],
                balance.amount
            );

            ICrossChainExecutor(executor).sendMessageOrToken(
                strategy.deposits[i].chainId,
                chains[strategy.deposits[i].chainId].receiver,
                "executeStrategy",
                index,
                "",
                chainAmount
            );
        }

        strategy.status = Status.EXECUTED;
        emit StrategyExecuted(msg.sender, strategy.amount, index, true);
    }

    function exitStrategyRequest(uint256 index) external nonReentrant {
        Strategy storage strategy = vaults[msg.sender][index];
        require(strategy.status == Status.EXECUTED, "Strategy not executed");

        for (uint256 i = 0; i < strategy.deposits.length; i++) {
            ICrossChainExecutor(executor).sendMessageOrToken(
                strategy.deposits[i].chainId,
                chains[strategy.deposits[i].chainId].receiver,
                "exitStrategyRequest",
                strategy.index,
                "",
                strategy.amount
            );
        }

        emit ExitStrategyRequested(msg.sender, index);
    }

    function exitStrategy(
        address user,
        uint256 index,
        uint64 chainId
    ) external {
        require(msg.sender == executor, "Not executor");

        Strategy storage strategy = vaults[user][index];
        require(strategy.status == Status.EXECUTED, "Not executed");

        bool found = false;
        for (uint256 j = 0; j < strategy.deposits.length; j++) {
            if (strategy.deposits[j].chainId == chainId) {
                found = true;
                break;
            }
        }
        require(found, "Strategy not found");

        strategy.status = Status.EXITED;
        emit StrategyExited(user, index);

        bool allExited = true;
        for (uint256 i = 0; i < vaults[user].length; i++) {
            if (vaults[user][i].status != Status.EXITED) {
                allExited = false;
                break;
            }
        }

        if (allExited) {
            ICrossMindVault(vault).removeBalance(user, strategy.index);
        }
    }

    function triggerRebalance(address user, uint256 index) external {
        require(msg.sender == executor, "Not executor");
        emit TriggerRebalance(user, index);
    }

    function validateStrategy(Strategy calldata strategy) internal view {
        uint256 totalPercentage = 0;
        uint64[] memory uniqueChains = new uint64[](strategy.deposits.length);
        uint256 count = 0;

        for (uint256 i = 0; i < strategy.deposits.length; i++) {
            ChainDeposit memory chainDeposit = strategy.deposits[i];

            require(
                isSupportedChainId(chainDeposit.chainId),
                "Unsupported chain ID"
            );

            for (uint256 k = 0; k < count; k++) {
                require(
                    uniqueChains[k] != chainDeposit.chainId,
                    "Chains must be unique"
                );
            }
            uniqueChains[count++] = chainDeposit.chainId;

            for (uint256 j = 0; j < chainDeposit.deposits.length; j++) {
                AdapterDeposit memory adapterDeposit = chainDeposit.deposits[j];
                require(
                    adapterDeposit.percentage > 0,
                    "Percentage must be > 0"
                );
                require(
                    isProtocol(chainDeposit.chainId, adapterDeposit.adapter),
                    "Adapter not registered"
                );
                totalPercentage += adapterDeposit.percentage;
            }
        }

        require(totalPercentage == 100, "Total percentage must be 100");
    }

    function calculateChainAmount(
        ChainDeposit memory chainDeposit,
        uint256 totalAmount
    ) internal pure returns (uint256) {
        uint256 chainPercentage = 0;
        for (uint256 i = 0; i < chainDeposit.deposits.length; i++) {
            chainPercentage += chainDeposit.deposits[i].percentage;
        }
        return (totalAmount * chainPercentage) / 100;
    }

    function addSupportedChainId(
        uint64 chainId,
        address receiver
    ) external onlyOwner {
        require(!isSupportedChainId(chainId), "Chain ID already supported");
        chains[chainId] = Chain(receiver);
    }

    function removeSupportedChainId(uint64 chainId) external onlyOwner {
        delete chains[chainId];
    }

    function addProtocol(
        uint64 chainId,
        string memory name,
        address adapter
    ) external onlyOwner {
        require(isSupportedChainId(chainId), "Chain ID not supported");
        chainProtocols[chainId].push(Protocol(name, adapter));
    }

    function removeProtocol(
        uint64 chainId,
        address adapter
    ) external onlyOwner {
        for (uint256 i = 0; i < chainProtocols[chainId].length; i++) {
            if (chainProtocols[chainId][i].adapter == adapter) {
                chainProtocols[chainId][i] = chainProtocols[chainId][
                    chainProtocols[chainId].length - 1
                ];
                chainProtocols[chainId].pop();
                return;
            }
        }
    }

    function isSupportedChainId(uint64 chainId) internal view returns (bool) {
        return chains[chainId].receiver != address(0);
    }

    function isProtocol(
        uint64 chainId,
        address adapter
    ) internal view returns (bool) {
        for (uint256 i = 0; i < chainProtocols[chainId].length; i++) {
            if (chainProtocols[chainId][i].adapter == adapter) {
                return true;
            }
        }
        return false;
    }

    function getVaults(address user) external view returns (Strategy[] memory) {
        return vaults[user];
    }

    function token() external view returns (address) {
        return ICrossMindVault(vault).token();
    }
}
