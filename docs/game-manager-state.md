# GameManager - GameManagerState.js 設計書

## 概要

`GameManagerState.js` はGameManagerの状態管理機能を提供するモジュールです。ゲーム全体の状態の管理、状態変更の追跡、状態の永続化と復元などを担当します。

## 役割

- ゲーム状態の管理と更新
- 状態変更の検証と整合性の維持
- 状態の永続化（保存）機能
- 状態の復元機能
- ゲーム状態の要約と取得
- トランザクション機能の提供

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、GameManagerの各種プロパティやメソッドに依存します。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### getCurrentState()
**説明**: 現在のゲーム状態を取得します。  
**アクセス**: public  
**戻り値**: 現在のゲーム状態  
**処理内容**:
- 現在の基本ゲーム状態を構築
- プレイヤー情報の収集
- タイムスタンプの追加
- 状態オブジェクトの返却

### getGameSummary()
**説明**: ゲーム状態の要約を取得します。  
**アクセス**: public  
**戻り値**: ゲーム状態の要約  
**処理内容**:
- 生存プレイヤーの取得
- プレイヤー統計の計算
- 陣営統計の計算
- 要約データの返却

### isGameStarted()
**説明**: ゲームが開始されているか確認します。  
**アクセス**: public  
**戻り値**: ゲームが開始されていればtrue  
**処理内容**:
- ゲーム状態から開始状態を返却

### isGameEnded()
**説明**: ゲームが終了しているか確認します。  
**アクセス**: public  
**戻り値**: ゲームが終了していればtrue  
**処理内容**:
- ゲーム状態から終了状態を返却

### saveGameState(saveId)
**説明**: ゲーム状態を保存します。  
**アクセス**: public  
**パラメータ**:
- saveId: 保存識別子（省略時は自動生成）  
**戻り値**: 保存されたゲーム状態  
**処理内容**:
- 保存IDの生成または使用
- 完全なゲーム状態の構築
- 保存前イベント発火
- 状態保存オブジェクトの作成
- 保存後イベント発火
- エラー処理

### buildFullGameState()
**説明**: 完全なゲーム状態を構築する内部メソッドです。  
**アクセス**: private  
**戻り値**: 完全なゲーム状態  
**処理内容**:
- 基本状態の取得
- プレイヤー状態の完全な情報収集
- 投票履歴の取得
- アクション履歴の取得
- 完全な状態オブジェクトの返却

### loadGameState(saveData)
**説明**: 保存されたゲーム状態から復元します。  
**アクセス**: public  
**パラメータ**:
- saveData: 保存されたゲーム状態  
**戻り値**: 復元成功時にtrue  
**処理内容**:
- 復元前のバリデーション
- 復元前イベント発火
- ゲーム状態のリセット
- 基本状態の復元
- レギュレーションの復元
- プレイヤーの復元と状態設定
- フェーズの復元
- 復元後イベント発火
- エラー処理

### validateSaveData(saveData)
**説明**: 保存データの検証を行います。  
**アクセス**: private  
**パラメータ**:
- saveData: 検証する保存データ  
**処理内容**:
- 必須フィールドの確認
- バージョン互換性の確認
- 状態データの妥当性確認
- エラー発生時は例外をスロー

### createStateSnapshot()
**説明**: 現在の状態のスナップショットを作成します。  
**アクセス**: private  
**戻り値**: 状態スナップショット  
**処理内容**:
- 状態、プレイヤー、フェーズの深いコピーを作成
- スナップショットオブジェクトの返却

### restoreStateSnapshot(snapshot)
**説明**: 状態スナップショットから状態を復元します。  
**アクセス**: private  
**パラメータ**:
- snapshot: 復元するスナップショット  
**処理内容**:
- 基本状態の復元
- プレイヤー状態の復元
- フェーズの復元

### beginTransaction()
**説明**: トランザクションを開始します（変更の一括適用のため）。  
**アクセス**: public  
**戻り値**: トランザクション開始成功時にtrue  
**処理内容**:
- トランザクション状態の確認
- スナップショットの作成
- 変更ログの初期化
- トランザクション開始イベント発火

### recordTransactionChange(type, data)
**説明**: トランザクション中の変更を記録します。  
**アクセス**: private  
**パラメータ**:
- type: 変更タイプ
- data: 変更データ  
**処理内容**:
- トランザクション状態の確認
- 変更の記録

### commitTransaction()
**説明**: トランザクションをコミットします（変更を確定）。  
**アクセス**: public  
**戻り値**: コミット成功時にtrue  
**処理内容**:
- トランザクション状態の確認
- トランザクションコミットイベント発火
- トランザクション状態のクリア
- 成功結果の返却

### rollbackTransaction()
**説明**: トランザクションをロールバックします（変更を取り消し）。  
**アクセス**: public  
**戻り値**: ロールバック成功時にtrue  
**処理内容**:
- トランザクション状態とスナップショットの確認
- 状態の復元
- トランザクションロールバックイベント発火
- トランザクション状態のクリア
- 成功結果の返却

## 設計上の注意点

1. **状態の一貫性**
   - 状態更新操作の原子性の確保
   - 中途半端な状態を防ぐためのトランザクション機構
   - 状態復元時の整合性検証

2. **状態の完全性**
   - 保存時に必要なすべての情報を含める
   - 関連する状態の依存関係を維持

3. **バージョン互換性**
   - 保存データのバージョン管理
   - メジャーバージョン間の互換性確認

4. **状態復元の安全性**
   - 無効な保存データの検出と適切なエラー処理
   - 部分的な復元の回避（すべてか何も復元しない）

5. **パフォーマンス考慮**
   - 大きな状態オブジェクトの効率的な処理
   - スナップショット作成時のディープコピーの最適化

## イベントリスト

状態管理に関連するイベント一覧：

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `state.save.before` | 状態保存前 | `{saveId, timestamp}` |
| `state.save.after` | 状態保存後 | `{saveId, timestamp}` |
| `state.load.before` | 状態復元前 | `{saveId, timestamp}` |
| `state.load.after` | 状態復元後 | `{saveId, timestamp}` |
| `state.transaction.begin` | トランザクション開始時 | `{timestamp}` |
| `state.transaction.commit` | トランザクションコミット時 | `{changes, timestamp}` |
| `state.transaction.rollback` | トランザクションロールバック時 | `{changes, timestamp}` |

## 使用例

```
// ゲーム状態の確認
const currentState = game.getCurrentState();
console.log(`現在のターン: ${currentState.turn}`);
console.log(`ゲーム状態: ${game.isGameStarted() ? '開始済み' : '未開始'}`);

// ゲームの要約情報取得
const summary = game.getGameSummary();
console.log(`生存プレイヤー: ${summary.players.alive}/${summary.players.total}`);
console.log(`陣営分布: ${JSON.stringify(summary.teams)}`);

// トランザクションの使用例
try {
  // トランザクション開始
  game.beginTransaction();
  
  // 複数の操作を実行
  game.killPlayer(0, 'execution');
  game.nextPhase();
  
  // 問題なければコミット
  game.commitTransaction();
} catch (error) {
  // エラー発生時はロールバック
  game.rollbackTransaction();
  console.error('トランザクション失敗:', error.message);
}

// ゲーム状態の保存
const savedState = game.saveGameState('game-2023-01-01');
console.log(`ゲーム状態を保存: ${savedState.id}`);

// 別のインスタンスでゲーム状態を復元
const newGame = new GameManager();
newGame.loadGameState(savedState);
console.log(`ゲーム状態を復元: ターン ${newGame.getCurrentTurn()}`);
```