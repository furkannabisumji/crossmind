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

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract DepositToVaultScript is Script {
    event Log(string message);

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address vault = 0x0b030C4fD5a31016D753102a6E939019E9119bb2; // العنوان الصحيح

        vm.startBroadcast(privateKey);

        ICrossMindVault vaultContract = ICrossMindVault(vault);
        address tokenAddress = vaultContract.token();
        require(
            tokenAddress == 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238,
            "Invalid USDC token address"
        );
        IERC20 token = IERC20(tokenAddress);

        uint256 amount = 10_000_000; // 10 USDC (مع دقة 6 decimals)
        uint8 risk = 1; // قيمة الـ risk

        // تحقق من الرصيد
        try token.balanceOf(msg.sender) returns (uint256 balance) {
            if (balance < amount) {
                emit Log("Insufficient balance");
                revert("Insufficient token balance");
            }
            emit Log(
                string(abi.encodePacked("Current balance: ", uint2str(balance)))
            );
        } catch {
            emit Log("Token balance check failed - Invalid token");
            revert("Invalid token or contract issue");
        }

        // الموافقة على الإيداع
        bool approval = token.approve(vault, amount);
        if (!approval) {
            emit Log("Approval failed");
            revert("Token approval failed");
        }
        emit Log("Approved successfully");

        // تنفيذ الإيداع
        vaultContract.deposit(amount, risk);
        emit Log("Deposited to vault");

        vm.stopBroadcast();
    }

    // دالة مساعدة لتحويل uint إلى string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }
}
