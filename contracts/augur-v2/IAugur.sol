pragma solidity 0.5.15;

import "./IMarket.sol";
import "./IAugurCreationDataGetter.sol";

contract IAugur is IAugurCreationDataGetter {
    function getMaximumMarketEndDate() public returns (uint256);

    function isKnownMarket(IMarket _market) public view returns (bool);
}
