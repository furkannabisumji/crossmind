// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AdapterRegistry.sol";
import "../src/StrategyManager.sol";

contract AdapterRegistryTest is Test {
    AdapterRegistry adapterRegistry;
    address token = address(0xDEAD);

    function setUp() public {
        adapterRegistry = new AdapterRegistry(token);
    }

    function testTokenGetter() public {
        address returnedToken = adapterRegistry.token();
        assertEq(returnedToken, token);
    }

    function testInvestStoresAmount() public {
        uint256 index = 1;
        uint256 amount = 1000;

        // Prepare empty deposits (مش هنستخدمها فعليا في الـ placeholder logic)
        StrategyManager.ChainDeposit[] memory deposits;

        adapterRegistry.invest(deposits, index, amount);

        // Assert that investedAmount[index] == amount
        assertEq(adapterRegistry.investedAmount(index), amount);
    }

    function testWithdrawClearsBalanceAndMarksWithdrawn() public {
        uint256 index = 1;
        uint256 amount = 1000;
        StrategyManager.ChainDeposit[] memory deposits;

        // Step 1: Invest first
        adapterRegistry.invest(deposits, index, amount);

        // Step 2: Withdraw
        adapterRegistry.withdraw(index);

        // Assert that withdrawn[index] == true
        assertTrue(adapterRegistry.withdrawn(index));

        // Assert that investedAmount[index] == 0
        assertEq(adapterRegistry.investedAmount(index), 0);
    }
}
