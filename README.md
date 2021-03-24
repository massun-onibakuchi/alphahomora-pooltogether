# PoolTogether Integraion

## Concept 
Users deposit their DAI in a contract called `BToken`, receive bToken (bDAI) in a 1:1 exchange, and express their Yes/No vote (bet) on the same prediction market as Augur in the BToken contract. (You don't buy shares in Augur).
After that, bToken is deposited into poolTogether, and in the background, bToken is converted into DAI and deposited into Compound, which is lent out.
After the Augur prediction market is finalized, the winners of the bets share the interest from Compound. The loser of the bet receives only the first bToken deposited, and can exchange it for DAI on a 1:1 basis with the BToken contract.
I want tot use Augur as an oracle in the sense that I need to know the final outcome. 

## Installation

## ToDo
- テスト