pragma solidity 0.5.15;

contract IMarket {
    enum MarketType { YES_NO, CATEGORICAL, SCALAR }

    function getNumberOfOutcomes() public view returns (uint256);

    function getNumTicks() public view returns (uint256);

    function getEndTime() public view returns (uint256);

    function getFinalizationTime() public view returns (uint256);

    function getDesignatedReportingEndTime() public view returns (uint256);

    function getNumParticipants() public view returns (uint256);

    function isFinalizedAsInvalid() public view returns (bool);

    function finalize() public returns (bool);

    function isFinalized() public view returns (bool);
}
