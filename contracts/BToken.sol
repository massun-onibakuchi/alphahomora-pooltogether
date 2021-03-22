// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./augur-v2/IMarket.sol";
import "./augur-v2/IAugur.sol";

contract BToken is ERC20 {
    // using SafeMath for uint256;

    IAugur public immutable augur;
    IMarket public market;

    constructor(
        string memory name_,
        string memory symbol_,
        IAugur augur_,
        IMarket market_,
        ) ERC20(name_, symbol_) {
            require(augur_.isKnownMarket(_market),"BToken/is-known-market");
            require(!market_.isFinalized(),"BToken/already-finalized");
            require(_market.MarketType==IMarket.MarketType.YES_NO,"BToken/only-market-type-yes-or-no");
            augur = augur_;
            market = market_;
        }
}
