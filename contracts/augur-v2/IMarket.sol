pragma solidity >=0.7.0 <0.8.0;

import "./IUniverse.sol";

interface IMarket {
    enum MarketType { YES_NO, CATEGORICAL, SCALAR }

    /**
     * @return The number of outcomes (including invalid) this market has
     */
    function getNumberOfOutcomes() external view returns (uint256);

    /**
     * @return Time at which the event is considered ready to report on
     */
    function getEndTime() external view returns (uint256);

    /**
     * @return The time the Market was finalzied as a uint256 timestmap if the market was finalized
     */
    function getFinalizationTime() external view returns (uint256);

    /**
     * @return The forking market for the associated universe if one exists
     */
    function getForkingMarket() external view returns (IMarket);

    /**
     * @return The uint256 timestamp for when the designated reporting period is over and anyone may report
     */
    function getDesignatedReportingEndTime() external view returns (uint256);

    /**
     * @return The Universe associated with this Market
     */
    function getUniverse() external view returns (IUniverse);

    /**
     * @return Bool indicating if the market resolved as anything other than Invalid
     */
    function isFinalizedAsInvalid() external view returns (bool);

    /**
     * @return Bool indicating if the market is finalized
     */
    function isFinalized() external view returns (bool);

    function isForkingMarket() external view returns (bool);
}
