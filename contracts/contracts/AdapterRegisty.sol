// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CrossChainToken.sol";
import "./CrossChainData.sol";
import "./interfaces/iStrategyAdapter.sol";

contract AdapterRegistry is Ownable {
    address[] public adapters;
    address public token;
    mapping(address =>mapping(address => uint256)) public balances;

    event AdapterAdded(address indexed adapter);
    event AdapterRemoved(address indexed adapter);

    function invest(address[] memory _adapters, address _user, uint256[] memory _amounts) external {
        require(_adapters.length == _amounts.length, "Amounts and adapters length mismatch");
        for (uint256 i = 0; i < _adapters.length; i++) {
            require(isAdapter(_adapters[i]), "Adapter not registered");
            IStrategyAdapter(_adapters[i]).invest(_user, _amounts[i]);
            balances[_adapters[i]][_user] += _amounts[i];
        }
    }

    function withdraw(address[] memory _adapters, address _user, uint256[] memory _amounts) external {
        require(_adapters.length == _amounts.length, "Amounts and adapters length mismatch");
        for (uint256 i = 0; i < _adapters.length; i++) {
            require(isAdapter(_adapters[i]), "Adapter not registered");
            IStrategyAdapter(_adapters[i]).withdraw(_user, _amounts[i]);
            balances[_adapters[i]][_user] -= _amounts[i];
        }
    }

    function addAdapter(address _adapter) external onlyOwner {
        adapters.push(_adapter);
        emit AdapterAdded(_adapter);
    }

    function removeAdapter(address _adapter) external onlyOwner {
        for (uint256 i = 0; i < adapters.length; i++) {
            if (adapters[i] == _adapter) {
                adapters[i] = adapters[adapters.length - 1];
                adapters.pop();
                emit AdapterRemoved(_adapter);
                return;
            }
        }
    }

    function getAdapters() external view returns (address[] memory) {
        return adapters;
    }

    function isAdapter(address _adapter) external view returns (bool) {
        for (uint256 i = 0; i < adapters.length; i++) {
            if (adapters[i] == _adapter) {
                return true;
            }
        }
        return false;
    }
}