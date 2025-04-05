# 変更履歴

## 2024-04-05
- VoteCounterの_getVoteStrength関数を強化
  - 投票重み値(voteStrength)の取得ロジックを修正
  - ログ出力の改善とエラー処理の強化
  - 型チェックの追加による堅牢性向上
- VoteManagerのgetVoteStrength関数にデバッグ情報を追加
- 投票作成時のvoteStrength設定ロジックを適切に分離

## 2024-04-06
- VoteManagerの実装を修正
  - startVoting関数にカスタム投票者・対象のサポートを追加
  - changeVote関数でvote.change.afterイベントのoldTargetId情報を修正
  - startRunoffVote関数の戻り値からattemptプロパティを削除（テスト対応）
- VoteCounterの実装を修正
  - _getVoteStrength関数を追加して投票の重み付け(村長=2票)を正確に処理
  - countVotesForTarget関数で投票重みを正しく計算するよう修正

## 2024-04-07
- VictoryManagerのテスト実装を追加
  - 村人陣営、人狼陣営、妖狐陣営の勝利条件テスト
  - 引き分け条件と優先度のテスト
  - カスタム勝利条件と時間制限のテスト
  - イベント処理と異常系のテスト
  - テストユーティリティの整備
  - モジュール構造の整理と分割
