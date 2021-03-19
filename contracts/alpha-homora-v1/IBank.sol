// SPDX-License-Identifier: GPL-3.0
/// @title Alpha Homora v1 Bank interface
/// @dev Alpha Homora v1 Bank.sol 5
pragma solidity >=0.7.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBank is IERC20 {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    /// @dev Return the pending interest that will be accrued in the next call.
    /// @param msgValue Balance value to subtract off address(this).balance when called from payable functions.
    function pendingInterest(uint256 msgValue) external view returns (uint256);

    /// @dev Return the ETH debt value given the debt share. Be careful of unaccrued interests.
    /// @param debtShare The debt share to be converted.
    function debtShareToVal(uint256 debtShare) external view returns (uint256);

    /// @dev Return the debt share for the given debt value. Be careful of unaccrued interests.
    /// @param debtVal The debt value to be converted.
    function debtValToShare(uint256 debtVal) external view returns (uint256);

    /// @dev Return ETH value and debt of the given position. Be careful of unaccrued interests.
    /// @param id The position ID to query.
    function positionInfo(uint256 id) external view returns (uint256, uint256);

    /// @dev Return the total ETH entitled to the token holders. Be careful of unaccrued interests.
    function totalETH() external view returns (uint256);

    /// @dev Add more ETH to the bank. Hope to get some good returns.
    function deposit() external payable;

    /// @dev Withdraw ETH from the bank by burning the share tokens.
    function withdraw(uint256 share) external;

    /// @dev Create a new farming position to unlock your yield farming potential.
    /// @param id The ID of the position to unlock the earning. Use ZERO for new position.
    /// @param goblin The address of the authorized goblin to work for this position.
    /// @param loan The amount of ETH to borrow from the pool.
    /// @param maxReturn The max amount of ETH to return to the pool.
    /// @param data The calldata to pass along to the goblin for more working context.
    function work(
        uint256 id,
        address goblin,
        uint256 loan,
        uint256 maxReturn,
        bytes calldata data
    ) external payable;

    /// @dev Kill the given to the position. Liquidate it immediately if killFactor condition is met.
    /// @param id The position ID to be killed.
    function kill(uint256 id) external;
}
