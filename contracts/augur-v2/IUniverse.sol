pragma solidity >=0.7.0 <0.8.0;

interface IUniverse {
    function creationTime() external view returns (uint256);

    function getPayoutNumerators() external view returns (uint256[] memory);

    function isForkingMarket() external view returns (bool);

    function isForking() external view returns (bool);
    
}
