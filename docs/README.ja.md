# PoolTogether Integraion

## Concept 
ユーザーは`BToken`というコントラクトにDAIを預け，1:1交換でbToken (bDAI)を受け取り，Augurと同じ予測市場をYes/Noの投票(賭け)をBTokenコントラクトで表明する．(Augurでshareを買うわけでは無い)
そのあと，bTokenをpoolTogetherにデポジットし，バックグラウンドでbTokenをDAIに変えてCompoundに預け，貸し出す．
Augur prediction marketがFinalizedされた後，賭けの勝者間でCompoundからの利息を分け合う．賭けの敗者は最初に預けたbTokenのみを受け取った後，BTokenコントラクトで1:1でDAIに交換できる．
つまり，最初に預けたトークンは1：1で返却されるので，負けの無い賭けができる．I want tot use Augur as an oracle in the sense that I need to know the final outcome. 

## Installation

## ToDo
- テスト