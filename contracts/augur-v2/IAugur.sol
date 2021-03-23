pragma solidity >=0.7.0 <0.8.0;
pragma abicoder v2;

import "./IMarket.sol";

interface IAugurCreationDataGetter {
    struct MarketCreationData {
        string extraInfo;
        address marketCreator;
        bytes32[] outcomes;
        int256[] displayPrices;
        IMarket.MarketType marketType;
        uint256 recommendedTradeInterval;
    }

    function getMarketCreationData(IMarket _market) external view returns (MarketCreationData memory);
}

interface IAugur is IAugurCreationDataGetter {
    function getMaximumMarketEndDate() external returns (uint256);

    function isKnownMarket(IMarket _market) external view returns (bool);
}
