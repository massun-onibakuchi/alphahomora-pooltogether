// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.8.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IYieldSource.sol";
import "./interface/IWETH.sol";

contract AlphaHomoraV1ETHLenderYieldSource is YieldSourceInterface {
    using SafeMath for uint256;
    IWETH immutable WETH;
    mapping(uint256 => uint256) public balances;

    constructor(IWETH _WETH) {
        WETH = _WETH;
    }

    function token() external view override returns (address) {
        return address(WETH);
    }

    function balanceOf(address addr) external override returns (uint256) {}

    function supplyTo(uint256 amount, address to) external override {}

    function redeem(uint256 amount) external override returns (uint256) {}
}
