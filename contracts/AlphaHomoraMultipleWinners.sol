// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import "@pooltogether/pooltogether-contracts/contracts/prize-strategy/multiple-winners/MultipleWinners.sol";

contract MultipleWinnersWithReserve is MutipleWinners {
    function _distribute(uint256 randomNumber) internal override {
        uint256 prize = prizePool.captureAwardBalance();

        // main winner is simply the first that is drawn
        address mainWinner = ticket.draw(randomNumber);

        // If drawing yields no winner, then there is no one to pick
        if (mainWinner == address(0)) {
            emit NoWinners();
            return;
        }

        // main winner gets all external ERC721 tokens
        _awardExternalErc721s(mainWinner);

        address[] memory winners = new address[](__numberOfWinners);
        winners[0] = mainWinner;

        uint256 nextRandom = randomNumber;
        for (uint256 winnerCount = 1; winnerCount < __numberOfWinners; winnerCount++) {
            // add some arbitrary numbers to the previous random number to ensure no matches with the UniformRandomNumber lib
            bytes32 nextRandomHash = keccak256(abi.encodePacked(nextRandom + 499 + winnerCount * 521));
            nextRandom = uint256(nextRandomHash);
            winners[winnerCount] = ticket.draw(nextRandom);
        }

        // yield prize is split up among all winners
        uint256 prizeShare = prize.div(winners.length);
        if (prizeShare > 0) {
            for (uint256 i = 0; i < winners.length; i++) {
                _awardTickets(winners[i], prizeShare);
            }
        }

        if (splitExternalErc20Awards) {
            address currentToken = externalErc20s.start();
            while (currentToken != address(0) && currentToken != externalErc20s.end()) {
                uint256 balance = IERC20Upgradeable(currentToken).balanceOf(address(prizePool));
                uint256 split = balance.div(__numberOfWinners);
                if (split > 0) {
                    for (uint256 i = 0; i < winners.length; i++) {
                        prizePool.awardExternalERC20(winners[i], currentToken, split);
                    }
                }
                currentToken = externalErc20s.next(currentToken);
            }
        } else {
            _awardExternalErc20s(mainWinner);
        }
    }
}
