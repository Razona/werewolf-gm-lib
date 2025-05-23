# GameManager 実装計画

「人狼ゲームGM支援ライブラリ」の中核となる GameManager の実装計画を作成します。GameManager はライブラリの全体を統括し、各モジュールを連携させる重要なコンポーネントです。

## 1. GameManager の役割と責務

GameManager は以下の主要な責務を持ちます：

- ゲームインスタンスの作成と初期化
- 各モジュールの統合と管理
- 公開APIの提供
- ゲーム状態の管理
- イベント伝播の調整

## 2. 依存モジュールの整理

GameManager は以下のモジュールに依存します：

- **コアモジュール**
  - EventSystem
  - ErrorSystem
  - Common/Utils

- **ドメインモジュール**
  - PlayerManager
  - RoleManager
  - PhaseManager
  - ActionManager
  - VoteManager
  - VictoryManager

## 3. 実装ステップ

### ステップ 1: 基本構造の設計と初期化

1. GameManager クラスの基本構造を定義
2. コンストラクタでの依存モジュールの初期化
3. 設定（options）の処理機構の実装
4. 基本的なゲーム状態の初期化

### ステップ 2: コアモジュールの統合

1. EventSystem の初期化と統合
2. ErrorSystem の初期化と統合
3. Common/Utils の統合

### ステップ 3: ドメインモジュールの統合

1. PlayerManager の初期化と統合
2. RoleManager の初期化と統合
3. PhaseManager の初期化と統合
4. 他のマネージャーの初期化と統合

### ステップ 4: 相互参照の設定

1. マネージャー間の相互参照の設計と実装
2. イベントリスナーの設定
3. クロスモジュールの連携確認

### ステップ 5: 公開APIの実装

1. プレイヤー管理API
2. 役職管理API
3. ゲーム進行API
4. 状態取得API

### ステップ 6: 状態管理とイベント処理

1. ゲーム状態の変更処理の実装
2. 状態変更時のイベント発火
3. ゲーム進行状態の管理

### ステップ 7: エラーハンドリングの実装

1. エラーケースの特定と処理方法の実装
2. エラー発生時のリカバリーメカニズム
3. デバッグ情報の提供

## 4. 主要なメソッド設計

### 初期化と設定関連

- `constructor(options)` - ゲームインスタンスの初期化
- `setRegulations(regulations)` - ゲームレギュレーションの設定
- `setup()` - 各モジュールの相互参照設定など初期設定

### プレイヤー管理関連

- `addPlayer(name)` - プレイヤーの追加
- `removePlayer(id)` - プレイヤーの削除
- `getPlayer(id)` - プレイヤー情報の取得
- `getAlivePlayers()` - 生存プレイヤーの取得

### 役職管理関連

- `setRoles(roleList)` - 役職リストの設定
- `distributeRoles()` - 役職の配布
- `getRoleInfo(playerId)` - 役職情報の取得

### ゲーム進行関連

- `start()` - ゲームの開始
- `nextPhase()` - 次のフェーズへの移行
- `getCurrentPhase()` - 現在のフェーズの取得
- `vote(voterId, targetId)` - 投票処理
- `registerAction(action)` - アクションの登録

### 状態管理関連

- `getCurrentState()` - 現在のゲーム状態の取得
- `getGameSummary()` - ゲームの概要取得
- `checkWinCondition()` - 勝利条件のチェック
- `endGame(result)` - ゲームの終了処理

### イベント管理関連

- `on(eventName, callback)` - イベントリスナーの登録
- `off(eventName, callback)` - イベントリスナーの削除
- `setupEventListeners()` - 内部イベントリスナーの設定

## 5. 実装における注意点

1. **依存関係の方向性**:
   - コアモジュール ← ドメインモジュール ← マネージャー ← GameManager
   - 上位モジュールが下位モジュールに依存する単方向の依存関係を維持

2. **状態の一貫性**:
   - 複数モジュールにまたがる状態変更の処理方法
   - イベント駆動による状態変更の伝播

3. **エラー処理**:
   - 各モジュールからのエラーの適切な処理
   - エラー発生時の状態回復メカニズム

4. **パフォーマンス最適化**:
   - 大規模ゲーム（多人数、複雑な役職構成）での性能考慮
   - イベントリスナーの効率的な管理

5. **拡張性**:
   - カスタム役職や特殊ルールの追加容易性の確保
   - 将来的な拡張への対応

## 6. テスト計画

### 単体テスト

1. GameManager の基本機能テスト
2. オプション処理のテスト
3. エラー処理のテスト

### 統合テスト

1. 各マネージャーとの連携テスト
2. イベント伝播のテスト
3. 状態変更の整合性テスト

### 機能テスト

1. プレイヤー追加と役職割り当てのテスト
2. フェーズ遷移のテスト
3. 投票と処刑のテスト
4. 夜アクションのテスト
5. 勝利条件判定のテスト

### シナリオテスト

1. 基本的なゲーム進行シナリオ
2. エッジケースのシナリオ（例: 同数投票、全滅ケース）
3. 複雑な役職構成での動作確認

## 7. 実装スケジュール

GameManagerの実装は以下のスケジュールで進めることが考えられます：

1. **週1**: 基本構造の設計と初期化機能の実装
2. **週2**: コアモジュールとドメインモジュールの統合
3. **週3**: 相互参照の設定と公開APIの実装
4. **週4**: 状態管理とイベント処理の実装
5. **週5**: エラーハンドリングの実装とテスト
6. **週6**: 全体的な結合テストと最適化

## 8. 進め方の提案

1. まず最小機能セットで動作する基本版を実装
2. 各機能を段階的に追加していく反復的アプローチ
3. 各段階で十分なテストを行い、問題を早期に発見
4. フィードバックを取り入れ継続的に改良

以上が GameManager の実装計画です。設計書に基づいて段階的に実装を進め、各モジュールとの連携を確保しながら、人狼ゲームを効果的に管理できるコンポーネントを構築します。