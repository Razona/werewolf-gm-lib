# 変更履歴

## 2024-04-08
- Actionモジュールのテストカバレッジを大幅に向上
  - Actionクラスのテスト追加: コンストラクタ、基本メソッド、アクション結果生成、エラー処理などをカバー
  - ActionManagerの追加テスト: 登録と検証処理、実行順序制御、人狼襲撃集計、アクション間相互作用をカバー
  - アクション履歴取得機能のテスト強化: 占い結果履歴、護衛結果履歴の取得をテスト
  - エッジケースのテスト強化: 不正なアクション種別、権限検証、例外処理をテスト
- テストの修正と改善
  - Action.test.jsで基本的な機能をテスト
  - ActionManager.extraCoverage.part*.test.jsに分割して各機能をテスト
  - プレイヤー名のモック値を実際の実装に合わせて修正

## 2024-04-07
- VictoryManagerのテスト実装を追加
  - 村人陣営、人狼陣営、妖狐陣営の勝利条件テスト
  - 引き分け条件と優先度のテスト
  - カスタム勝利条件と時間制限のテスト
  - イベント処理と異常系のテスト
  - テストユーティリティの整備
  - モジュール構造の整理と分割

## 2024-04-06
- VoteManagerの実装を修正
  - startVoting関数にカスタム投票者・対象のサポートを追加
  - changeVote関数でvote.change.afterイベントのoldTargetId情報を修正
  - startRunoffVote関数の戻り値からattemptプロパティを削除（テスト対応）
- VoteCounterの実装を修正
  - _getVoteStrength関数を追加して投票の重み付け(村長=2票)を正確に処理
  - countVotesForTarget関数で投票重みを正しく計算するよう修正

## 2024-04-05
- VoteCounterの_getVoteStrength関数を強化
  - 投票重み値(voteStrength)の取得ロジックを修正
  - ログ出力の改善とエラー処理の強化
  - 型チェックの追加による堅牢性向上
- VoteManagerのgetVoteStrength関数にデバッグ情報を追加
- 投票作成時のvoteStrength設定ロジックを適切に分離
