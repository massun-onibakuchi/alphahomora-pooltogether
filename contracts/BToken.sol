// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./augur-v2/IAugur.sol";
import "./augur-v2/IMarket.sol";
import "./augur-v2/IUniverse.sol";

contract BToken is ERC20, ReentrancyGuard {
    using SafeMath for uint256;

    uint8 private constant NUM_POSITIONS = 3;
    IERC20 private immutable uToken;
    IAugur private immutable augur;
    IMarket private market;

    event Deposited(address indexed sender, address to, uint256 amount);
    event Withdrawal(address indexed sender, address indexed from, uint256 amount);
    event BetChanged(address indexed addr, uint8 oldPosition, uint8 newPosition);
    event ResetBet(address indexed addr);

    enum Position { INVALID, NO, YES }

    mapping(address => Position) private addrToPositions;

    constructor(
        string memory name,
        string memory symbol,
        IERC20 _uToken,
        IAugur _augur,
        IMarket _market
    ) ERC20(name, symbol) {
        require(_augur.isKnownMarket(_market), "BToken/invalid-market");
        require(!_market.isFinalized(), "BToken/already-finalized");
        // require(!_market.isForkingMarket(),"BToken/forking-market");
        require(
            _augur.getMarketCreationData(_market).marketType == IMarket.MarketType.YES_NO,
            "BToken/only-market-type-yes-or-no"
        );
        uToken = _uToken;
        augur = _augur;
        market = _market;
    }

    /* deposit/withdraw */

    function deposit(address to, uint256 amount) public nonReentrant returns (bool) {
        _mint(to, amount);
        // require(uToken.transferFrom(msg.sender, address(this), amount),"BToken/underlying-token-transfer-fail");
        SafeERC20.safeTransferFrom(uToken, msg.sender, to, amount);
        emit Deposited(msg.sender, to, amount);
        return true;
    }

    function withdraw(address from, uint256 amount) public nonReentrant returns (bool) {
        _burn(from, amount);
        SafeERC20.safeTransfer(uToken, msg.sender, amount);
        emit Withdrawal(msg.sender, from, amount);
        return true;
    }

    /* bet */

    function getPosition(address addr) public view returns (Position) {
        return addrToPositions[addr];
    }

    function bet(uint8 _pos) public returns (bool) {
        _bet(msg.sender, _pos);
        return true;
    }

    function _bet(address _addr, uint8 _pos) internal {
        require(balanceOf(_addr) > 0, "BToken/balance-zero-bet");
        require(_pos < NUM_POSITIONS, "BToken/_pos-is-out-of-range");
        Position oldPosition = addrToPositions[_addr];
        addrToPositions[_addr] = Position(_pos);
        emit BetChanged(_addr, uint8(oldPosition), _pos);
    }

    /* matket result */

    function getFinalizedPayoutNumerators() public view returns (uint256[] memory) {
        if (market.isFinalized() || market.isFinalizedAsInvalid()) {
            IUniverse universe = getUniverse();
            return universe.getPayoutNumerators();
        }
        return new uint256[](0);
    }

    /* get */

    function getUniverse() public view returns (IUniverse) {
        return market.getUniverse();
    }

    function getAugur() public view returns (IAugur) {
        return augur;
    }

    function getMarket() public view returns (IMarket) {
        return market;
    }

    /* underlying token */

    function underlyingToken() external view returns (address) {
        return address(uToken);
    }

    /**
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be to transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // condition: burn
        if (from == address(0)) {
            return;
        }
        // else
        if (balanceOf(from).sub(amount) == 0) {
            _bet(from, uint8(Position.INVALID));
            emit ResetBet(from);
        }
    }
}
