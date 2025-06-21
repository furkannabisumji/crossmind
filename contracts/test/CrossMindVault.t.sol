// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CrossMindVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 Token with 6 decimals (like USDC)
contract MockERC20 is IERC20 {
    string public name = "MockUSDC";
    string public symbol = "mUSDC";
    uint8 public decimals = 6;
    uint256 public override totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    function transfer(
        address to,
        uint256 amount
    ) external override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(
        address spender,
        uint256 amount
    ) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool) {
        require(
            allowance[from][msg.sender] >= amount,
            "Insufficient allowance"
        );
        require(balanceOf[from] >= amount, "Insufficient balance");

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

contract CrossMindVaultTest is Test {
    CrossMindVault vault;
    MockERC20 token;
    address user = address(0xABCD);
    address strategyManager =
        address(0x1234567890123456789012345678901234567890);

    function setUp() public {
        token = new MockERC20();
        vault = new CrossMindVault(address(token), strategyManager);
        token.mint(user, 1_000_000 * 1e6); // 1,000,000 USDC mock
        vm.label(user, "User");
        vm.label(address(token), "MockUSDC");
        vm.label(address(vault), "CrossMindVault");
    }

    function testDeposit() public {
        vm.startPrank(user);

        token.approve(address(vault), 500_000 * 1e6); // approve 500k USDC
        vault.deposit(500_000 * 1e6, CrossMindVault.Risk.LOW);

        CrossMindVault.Balance[] memory balances = vault.getBalance(user);
        assertEq(balances.length, 1);
        assertEq(balances[0].amount, 500_000 * 1e6);
        assertEq(token.balanceOf(address(vault)), 500_000 * 1e6);

        vm.stopPrank();
    }

    function testWithdraw() public {
        vm.startPrank(user);

        token.approve(address(vault), 500_000 * 1e6);
        vault.deposit(500_000 * 1e6, CrossMindVault.Risk.LOW);

        vault.withdraw(0);

        CrossMindVault.Balance[] memory balances = vault.getBalance(user);
        assertEq(balances.length, 1);
        assertEq(balances[0].amount, 0);
        assertEq(token.balanceOf(user), 1_000_000 * 1e6); // Full balance restored

        vm.stopPrank();
    }

    function testLockAndUnlock() public {
        // Mint & deposit
        vm.startPrank(user);
        token.approve(address(vault), 100_000 * 1e6);
        vault.deposit(100_000 * 1e6, CrossMindVault.Risk.LOW);
        vm.stopPrank();

        // Lock from strategyManager
        vm.startPrank(strategyManager);
        vault.lock(user, 0);
        assertEq(token.balanceOf(strategyManager), 100_000 * 1e6);
        vm.stopPrank();

        // Unlock (just toggles flag)
        vm.prank(strategyManager);
        vault.unlock(user, 0);

        CrossMindVault.Balance[] memory balances = vault.getBalance(user);
        assertFalse(balances[0].locked);
    }
}
