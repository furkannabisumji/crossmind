// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CrossMindVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock Token
contract MockERC20 is IERC20 {
    string public name = "MockToken";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

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

contract CrossMindVaultTest is Test {
    CrossMindVault vault;
    MockERC20 token;
    address user = address(0xABCD);
    address strategyManager =
        address(0x1234567890123456789012345678901234567890); // Valid non-zero address

    function setUp() public {
        // Deploy mock token
        token = new MockERC20();

        // Deploy vault with valid strategyManager
        vault = new CrossMindVault(address(token), strategyManager);

        // Give user some tokens
        token.mint(user, 1000 ether);

        // Label addresses (for pretty traces)
        vm.label(user, "User");
        vm.label(address(token), "MockToken");
        vm.label(address(vault), "CrossMindVault");
    }

    function testDeposit() public {
        vm.startPrank(user);

        token.approve(address(vault), 500 ether);

        vault.deposit(500 ether, CrossMindVault.Risk.LOW);

        CrossMindVault.Balance[] memory balances = vault.getBalance(user);
        assertEq(balances.length, 1);
        assertEq(balances[0].amount, 500 ether);

        vm.stopPrank();
    }

    function testWithdraw() public {
        vm.startPrank(user);

        token.approve(address(vault), 500 ether);

        vault.deposit(500 ether, CrossMindVault.Risk.LOW);

        vault.withdraw(0);

        CrossMindVault.Balance[] memory balances = vault.getBalance(user);
        assertEq(balances.length, 1);
        assertEq(balances[0].amount, 0);

        vm.stopPrank();
    }
}
