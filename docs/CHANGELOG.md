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

## 2024-04-03
- プロジェクトディレクトリ構造とファイル配置のドキュメントを更新
- 実装状況の詳細分析と次のステップに関するドキュメントを作成
- ESM/CommonJSの混在問題を特定し、統一の必要性を指摘
- 次のステップとしてActionモジュールの実装を推奨