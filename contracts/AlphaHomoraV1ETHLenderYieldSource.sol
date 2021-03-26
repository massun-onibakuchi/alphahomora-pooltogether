// SPDX-License-Identifier: GPL-3.0
/// @title Custom yield source intergration Alpha Homora v1 ETHLender
/// @dev Alpha Homora source code / doc
/// https://alphafinancelab.gitbook.io/alpha-homora/protocol-users#eth-lenders
/// https://alphafinancelab.gitbook.io/alpha-finance-lab/alpha-products/alpha-homora

/* solhint-disable var-name-mixedcase */
pragma solidity >=0.7.0 <0.8.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "hardhat/console.sol";
import "./alpha-homora-v1/IBank.sol";
import "./interface/IYieldSource.sol";
import "./interface/IWETH.sol";

contract AlphaHomoraV1ETHLenderYieldSource is IYieldSource {
    using SafeMath for uint256;

    IBank public immutable bank;
    IWETH public immutable WETH;

    ///@dev ibETH token balances
    mapping(address => uint256) private balances;

    receive() external payable {
        // only accept ETH via fallback from the WETH contract
        assert(msg.sender == address(WETH) || msg.sender == address(bank));
    }

    constructor(IBank _bank, IWETH _WETH) {
        bank = _bank;
        WETH = _WETH;
    }

    function balanceOf(address addr) public view returns (uint256) {
        return balances[addr];
    }

    function depositToken() external view override returns (address) {
        return address(WETH);
    }

    /// @notice Returns the total balance (in asset tokens).  This includes the deposits and interest.
    /// @return The underlying balance of asset tokens
    function balanceOfToken(address addr) external view override returns (uint256) {
        uint256 shares = bank.balanceOf(address(this));
        uint256 total = bank.totalSupply();
        if (total == 0) {
            return 0;
        }
        // console.log("addr's ibETH balance", balances[addr]);
        uint256 ethBalance = shares.mul(bank.totalETH()).div(total);
        return balances[addr].mul(ethBalance).div(total);
    }

    /// @notice Supplies asset tokens to the yield source.
    /// @param amount The amount of asset tokens to be supplied
    function supplyTokenTo(uint256 amount, address to) external override {
        // receive WETH and withdraw ETH
        WETH.transferFrom(msg.sender, address(this), amount);
        WETH.withdraw(amount);

        // ibETH balance before
        uint256 balanceBefore = bank.balanceOf(address(this));

        // Deposit ETH and receive ibETH
        bank.deposit{ value: address(this).balance }();

        // ibETH balance after
        uint256 balanceAfter = bank.balanceOf(address(this));
        uint256 balanceDiff = balanceAfter.sub(balanceBefore);
        balances[to] = balances[to].add(balanceDiff);
    }

    /// @notice Redeems asset tokens from the yield source.
    /// @param redeemAmount The amount of yield-bearing tokens to be redeemed (ie. ether amount)
    /// @return The actual amount of tokens that were redeemed.
    function redeemToken(uint256 redeemAmount) external override returns (uint256) {
        uint256 totalShares = bank.totalSupply();
        uint256 bankETHBalance = bank.totalETH(); // WETH.balanceOf(address(bank))
        uint256 requiredShares = redeemAmount.mul(totalShares).div(bankETHBalance);

        // balance before
        uint256 bankBlanceBefore = bank.balanceOf(address(this));
        uint256 wethBlanceBefore = WETH.balanceOf(address(this));

        // receive ETH
        bank.withdraw(requiredShares);
        // convert ETH to WETH
        WETH.deposit{ value: address(this).balance }();

        // balance after
        uint256 bankBalanceAfter = bank.balanceOf(address(this));
        uint256 wethBalanceAfter = WETH.balanceOf(address(this));

        uint256 bankBalanceDiff = bankBlanceBefore.sub(bankBalanceAfter); // diff should be greater than 0
        uint256 wethBalanceDiff = wethBalanceAfter.sub(wethBlanceBefore); // diff should be greater than 0
        balances[msg.sender] = balances[msg.sender].sub(bankBalanceDiff);

        require(WETH.transfer(msg.sender, wethBalanceDiff), "WETH_TRANSFER_FAIL");
        return wethBalanceDiff;
    }
}
