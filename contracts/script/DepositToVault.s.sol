// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface ICrossMindVault {
    function deposit(uint256 amount, uint8 risk) external;

    function token() external view returns (address);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address user) external view returns (uint256);
}

contract DepositToVaultScript is Script {
    event Log(string message);

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address vault = 0x8F9bb932990E32E548E9E1eb693E75253E566Be3; // ← غيّريه حسب العنوان الحقيقي

        vm.startBroadcast(privateKey);

        ICrossMindVault vaultContract = ICrossMindVault(vault);
        address tokenAddress = vaultContract.token();
        IERC20 token = IERC20(tokenAddress);

        uint256 amount = 1 ether; // مقدار الإيداع
        uint8 risk = 1; // قيمة الـ risk (تعديل حسب الحاجة)

        require(token.approve(vault, amount), "Approval failed");

        vaultContract.deposit(amount, risk);

        emit Log("Deposited to vault");

        vm.stopBroadcast();
    }
}
