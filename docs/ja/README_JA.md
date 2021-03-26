# AlphaHomora PoolTogether
Alpha Finance and PoolTogether Integration.  

[Overview](../en/overview.md)  

PoolTogetherはPrize Savings Protocol Ethereumのスマートコントラクトです。
コンセプトやAPIの概要については、[ドキュメント](https://docs.pooltogether.com/)をご覧ください。

## Concept 
PoolTogetherプロトコルには、Compoundなどのイールドソース・インテグレーションがあらかじめ組み込まれています。現在、PoolTogetherでは、DAI、USDC、UNIをCompoundに預けることで、損をしない宝くじを提供しています。しかし、ETHの貸出レートが低いためか、ETHを預けてのノーロス・ロッタリーは見当たりません。

Alpha Homoraは、DeFiで初めてのレバレッジド・イールド・ファーミングとレバレッジド・リクイディティを提供する商品です。

そこで，Alpha Financeをイールドソースとして組み込むことで、より高いETHの貸出レートを得ることができます。

[Learn more in the Earn on ETH section.](https://alphafinancelab.gitbook.io/alpha-homora/#earn-on-eth)

[Alpha Homora GitHub](https://github.com/AlphaFinanceLab/alphahomora)

## Setup
依存関係をインストールするには、以下を実行します。
`yarn`

テストを実行するには、環境変数が必要です。プロジェクトのルートディレクトリに`.env`ファイルを作成してください。
``` 
ETHERSCAN_API_KEY=
ALCHEMY_API_KEY=
```
一つ目は[Etherscan](https://etherscan.io/)から手に入ります．
二つ目は[Alchemy](https://dashboard.alchemyapi.io/)で手に入ります．

## Test
`yarn test`