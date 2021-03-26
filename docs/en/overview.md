# Overview
## PoolTogether 
### Custom Yield Source
PoolTogether can intergrate any protocol that serves as as yield source. Yield Source Interface is a generic interface that allows a Yield Source Prize Pool to use an external contract for yield.

Specification https://github.com/pooltogether/yield-source-interface

## AlphaHomora
### ETHLenders
**Interest Bearing ETH (ibETH)**

When users deposit ETH to Bank, they receive a proportional amount of ibETH token, a tradable and interest-bearing asset that represents their shares of ETH in the bank pool, similar to cToken in Compound.

[How to calculate a minted or burned amount.](https://compound.finance/docs/ctokens#introduction)

[Developer Doc](https://alphafinancelab.gitbook.io/alpha-homora-developer-doc/become-to-the-lender-of-alpha-homora-v1)

[AlphaHomora v1 Bank.sol](https://github.com/AlphaFinanceLab/alphahomora/blob/master/contracts/5/Bank.sol)

## AlphaHomoraV1ETHLenderYieldSource
This contract implements `IYieldSource`, which lends received ETH to Alpha Homora `bank`.