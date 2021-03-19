// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.8.0;

interface YieldSourceInterface {
    function token() external view returns (address);

    function balanceOf(address addr) external returns (uint256);

    function supplyTo(uint256 amount, address to) external;

    function redeem(uint256 amount) external returns (uint256);
}
