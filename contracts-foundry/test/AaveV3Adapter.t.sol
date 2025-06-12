// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/adapters/AaveV3Adapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 → نعملها عشان AaveV3Adapter يعمل عليها transferFrom
contract MockERC20 is IERC20 {
    string public name = "MockToken";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    uint256 public override totalSupply = 1_000_000 ether;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(
        address to,
        uint256 amount
    ) external override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(
        address spender,
        uint256 amount
    ) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// Mock AaveV3Pool
contract MockAaveV3Pool is IAaveV3Pool {
    uint256 public suppliedAmount;
    uint256 public withdrawnAmount;

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external override {
        suppliedAmount += amount;
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        withdrawnAmount += amount;
        return amount;
    }

    // ✅ function to help tests:
    function setSuppliedAmount(uint256 amount) external {
        suppliedAmount = amount;
    }
}

contract AaveV3AdapterTest is Test {
    AaveV3Adapter adapter;
    MockAaveV3Pool mockAavePool;
    MockERC20 mockToken;

    address owner = address(this);

    function setUp() public {
        mockAavePool = new MockAaveV3Pool();
        adapter = new AaveV3Adapter(address(mockAavePool));
        mockToken = new MockERC20();

        // Approve adapter to spend tokens
        mockToken.approve(address(adapter), type(uint256).max);
    }

    function testInvestEmitsEvent() public {
        uint256 amount = 1000;

        // Send tokens to adapterTest contract to simulate user balance
        mockToken.transfer(address(this), amount);
        mockToken.approve(address(adapter), amount);

        vm.expectEmit(true, true, true, true);
        emit AaveV3Adapter.Invested(address(mockToken), amount, address(this));

        bool success = adapter.invest(amount, address(mockToken));

        assertTrue(success);

        assertEq(mockAavePool.suppliedAmount(), amount);
    }

    function testWithdrawEmitsEvent() public {
        uint256 amount = 500;

        // Set suppliedAmount in mock pool for simulation:
        mockAavePool.setSuppliedAmount(amount);

        vm.expectEmit(true, true, true, true);
        emit AaveV3Adapter.Withdrawn(address(mockToken), amount, address(this));

        bool success = adapter.withdraw(amount, address(mockToken));

        assertTrue(success);

        assertEq(mockAavePool.withdrawnAmount(), amount);
    }
}
