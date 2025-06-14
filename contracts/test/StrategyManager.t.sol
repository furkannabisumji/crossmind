// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StrategyManager.sol";
import "../src/CrossMindVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock CrossChainExecutor
contract MockCrossChainExecutor {
    event MockSendMessageOrToken(
        uint64 destinationChainSelector,
        address receiver,
        string action,
        uint256 index,
        bytes deposits,
        uint256 amount
    );

    function sendMessageOrToken(
        uint64 destinationChainSelector,
        address receiver,
        string calldata action,
        uint256 index,
        bytes calldata deposits,
        uint256 amount
    ) external returns (bytes32) {
        emit MockSendMessageOrToken(
            destinationChainSelector,
            receiver,
            action,
            index,
            deposits,
            amount
        );
        return
            keccak256(
                abi.encodePacked(
                    destinationChainSelector,
                    receiver,
                    action,
                    index,
                    amount
                )
            );
    }
}

contract StrategyManagerTest is Test {
    CrossMindVault vault;
    StrategyManager manager;
    MockCrossChainExecutor executor;

    address user = address(0xABCD);

    MockERC20 token;

    function setUp() public {
        token = new MockERC20();
        executor = new MockCrossChainExecutor();

        // Deploy StrategyManager first with a dummy vault address
        manager = new StrategyManager(address(0), address(executor));

        // Deploy vault with the StrategyManager address
        vault = new CrossMindVault(address(token), address(manager));

        // Update StrategyManager with the actual vault address
        manager = new StrategyManager(address(vault), address(executor));

        // Update strategyManager in vault to the new manager address
        vm.prank(vault.owner());
        vault.setStrategyManager(address(manager));

        // Verify that strategyManager is set correctly
        assertEq(
            vault.strategyManager(),
            address(manager),
            "StrategyManager not set correctly"
        );

        // Give manager ownership of vault
        vm.prank(vault.owner());
        vault.transferOwnership(address(manager));

        vm.label(user, "User");
    }

    function testFullFlow() public {
        // 1️⃣ Deposit to Vault
        uint256 depositAmount = 1000 ether;
        token.mint(user, depositAmount);

        vm.startPrank(user);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, CrossMindVault.Risk.MEDIUM);
        vm.stopPrank();

        // 2️⃣ Owner adds chain + protocol
        uint64 chainId = 1;
        address receiver = address(0x1234);
        address adapter = address(0x5678);

        vm.prank(manager.owner());
        manager.addSupportedChainId(chainId, receiver);
        vm.prank(manager.owner());
        manager.addProtocol(chainId, "TestProtocol", adapter);

        // 3️⃣ User registerStrategy

        // prepare AdapterDeposits
        StrategyManager.AdapterDeposit[]
            memory adapterDeposits = new StrategyManager.AdapterDeposit[](1);
        adapterDeposits[0] = StrategyManager.AdapterDeposit({
            adapter: adapter,
            percentage: 100
        });

        // prepare ChainDeposits
        StrategyManager.ChainDeposit[]
            memory chainDeposits = new StrategyManager.ChainDeposit[](1);
        chainDeposits[0] = StrategyManager.ChainDeposit({
            chainId: chainId,
            amount: 0,
            deposits: adapterDeposits
        });

        // prepare Strategy struct
        StrategyManager.Strategy memory strategy = StrategyManager.Strategy({
            index: 0,
            status: StrategyManager.Status.PENDING,
            amount: depositAmount,
            deposits: chainDeposits
        });

        vm.prank(user);
        manager.registerStrategy(strategy, 0);

        // 4️⃣ confirmStrategy
        vm.prank(user);
        manager.confirmStrategy(0, true);

        // 5️⃣ exitStrategyRequest
        vm.prank(user);
        manager.exitStrategyRequest(0);

        // 6️⃣ exitStrategy (executor)
        vm.prank(address(executor));
        manager.exitStrategy(user, 0, chainId);

        // ✅ check that status == EXITED
        StrategyManager.Strategy[] memory vaultStrategies = manager.getVaults(
            user
        );
        assertEq(
            uint256(vaultStrategies[0].status),
            uint256(StrategyManager.Status.EXITED)
        );
    }
}

// Mock ERC20 token
contract MockERC20 {
    string public constant name = "MockToken";
    string public constant symbol = "MTK";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
}
