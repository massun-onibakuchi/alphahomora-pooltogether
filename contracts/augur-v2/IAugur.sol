pragma solidity >=0.7.0 <0.8.0;

import "./IMarket.sol";

contract IAugurCreationDataGetter {
    struct MarketCreationData {
        string extraInfo;
        address marketCreator;
        bytes32[] outcomes;
        int256[] displayPrices;
        IMarket.MarketType marketType;
        uint256 recommendedTradeInterval;
    }

    function getMarketCreationData(IMarket _market) public view returns (MarketCreationData memory);
}

contract IAugur is IAugurCreationDataGetter {
    function getMaximumMarketEndDate() public returns (uint256);

    function isKnownMarket(IMarket _market) public view returns (bool);
}
