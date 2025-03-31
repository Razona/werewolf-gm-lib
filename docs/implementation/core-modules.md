# 人狼ゲームGM支援ライブラリ コアモジュール実装仕様

## 概要

本ドキュメントでは、人狼ゲームGM支援ライブラリのコアモジュールの実装仕様について説明します。コアモジュールは、ライブラリの基盤となる基本的な機能を提供し、他のすべてのモジュールから利用されます。

## コアモジュールの構成

コアモジュールは以下の3つのサブモジュールで構成されています：

1. **EventSystem** - イベント駆動アーキテクチャの中核
2. **ErrorSystem** - エラー処理と検証の標準化
3. **Common/Utils** - 共通ユーティリティ関数

## 1. EventSystem

### 目的

EventSystemは、ライブラリ全体のイベント管理を担当します。モジュール間の疎結合な通信を可能にし、ゲーム状態の変更や重要なアクションの通知を行います。

### 主要コンポーネント

- **EventEmitter** - イベントの登録と発火を行うコアクラス

### 主要インターフェース

```javascript
class EventEmitter {
  // イベントリスナーの登録
  on(eventName, callback, priority = 0) { ... }
  
  // 一度だけ実行されるリスナーを登録
  once(eventName, callback, priority = 0) { ... }
  
  // イベントの発火
  emit(eventName, data) { ... }
  
  // リスナーの削除
  off(eventName, callback = null) { ... }
  
  // イベントリスナーの有無確認
  hasListeners(eventName) { ... }
  
  // イベントリスナー数の取得
  listenerCount(eventName) { ... }
  
  // 登録されているイベント名の取得
  eventNames() { ... }
}
```

### 特徴

- **優先度付きリスナー**: リスナーは優先度順に実行されます
- **階層的イベント名**: ドット区切りの階層構造をサポート（例: `phase.start.night`）
- **エラーハンドリング**: リスナー実行中のエラーは他のリスナーの実行を妨げません
- **リスナーの自動削除**: `once`メソッドで登録されたリスナーは一度実行後に自動的に削除されます

### 使用例

```javascript
const eventSystem = new EventSystem();

// イベントリスナーの登録
eventSystem.on('player.death', (data) => {
  console.log(`プレイヤー${data.playerId}が死亡しました`);
});

// イベントの発火
eventSystem.emit('player.death', { playerId: 3, reason: 'execution' });

// 一度だけ実行されるリスナー
eventSystem.once('game.start', (data) => {
  console.log('ゲームが開始されました');
});

// リスナーの削除
eventSystem.off('player.death');
```

## 2. ErrorSystem

### 目的

ErrorSystemは、ライブラリ全体のエラー処理を標準化し、一貫したエラーメッセージとハンドリングを提供します。

### 主要コンポーネント

- **ErrorCatalog** - エラー定義のカタログ
- **ErrorHandler** - エラー処理のコアクラス
- **Validator** - 入力検証ユーティリティ

### 主要インターフェース

```javascript
class ErrorHandler {
  // エラーの登録
  register(errorCode, context) { ... }
  
  // エラー処理
  handleError(error) { ... }
  
  // エラーオブジェクトの生成
  createError(code, message, context) { ... }
  
  // エラー処理ポリシーの設定
  setErrorPolicy(policy) { ... }
  
  // エラーレポートの生成
  createErrorReport(detail = false) { ... }
}

class Validator {
  // 条件の検証
  validateCondition(condition, errorCode, message) { ... }
  
  // プレイヤーアクションの検証
  validatePlayerAction(action, player) { ... }
  
  // 役職アクションの検証
  validateRoleAction(action, role) { ... }
}
```

### エラー構造

```javascript
{
  code: "E0101",           // エラーコード
  message: "無効なプレイヤーID", // エラーメッセージ
  level: "error",          // エラーレベル
  context: {               // コンテキスト情報
    playerId: 999,
    phase: "night"
  },
  timestamp: 1621234567890 // タイムスタンプ
}
```

### 特徴

- **標準化されたエラーコード**: 一貫したエラーコード体系でデバッグを容易に
- **コンテキスト情報**: エラー発生時の状況を把握するための詳細情報
- **エラーレベル**: fatal、error、warning、infoの4段階のレベル分け
- **イベント連携**: エラー発生時にイベントを発火し、外部システムへの通知が可能
- **カスタマイズ可能なポリシー**: エラー処理方法をカスタマイズ可能

### 使用例

```javascript
const errorHandler = new ErrorHandler(eventSystem);

// エラー処理ポリシーの設定
errorHandler.setErrorPolicy({
  throwLevel: 'error',  // errorレベル以上でthrow
  logLevel: 'warning',  // warningレベル以上をログに記録
  emitEvents: true      // イベント発火を有効化
});

// エラー処理
try {
  // 何らかの処理
  if (!isValidPlayerId(playerId)) {
    throw errorHandler.createError(
      'E0101',
      '無効なプレイヤーID',
      { playerId }
    );
  }
} catch (error) {
  errorHandler.handleError(error);
}
```

## 3. Common/Utils

### 目的

Common/Utilsモジュールは、ライブラリ全体で使用される共通のユーティリティ関数を提供します。

### 主要カテゴリ

#### バリデーション関数

- `isValidPlayerId(id)` - プレイヤーIDの検証
- `isValidRoleName(roleName, availableRoles)` - 役職名の検証
- `isValidPhase(phase, allowedPhases)` - フェーズ名の検証
- `isValidAction(action, allowedActions)` - アクションの検証

#### コレクション操作

- `filterAlivePlayers(players)` - 生存プレイヤーのフィルタリング
- `findPlayersByRole(players, roleName)` - 特定の役職を持つプレイヤーの検索
- `countVotes(votes)` - 投票結果の集計

#### ゲームロジック

- `distributeRoles(roles, playerIds)` - 役職配布ヘルパー
- `selectRandomTiedPlayer(tiedPlayers)` - 同数得票プレイヤーからのランダム選択

#### 一般ユーティリティ

- `randomElement(array)` - 配列からランダムに要素を選択
- `generateUniqueId()` - 一意のIDを生成

#### イベント処理

- `parseEventName(eventName)` - イベント名のパース
- `eventNameMatches(eventName, pattern)` - イベント名のマッチング

### 特徴

- **モジュラー設計**: 各関数は独立しており、必要に応じて個別にインポート可能
- **依存関係なし**: 外部ライブラリに依存せず、標準のJavaScript機能のみを使用
- **ゲーム特化**: 人狼ゲーム特有のユースケースに特化した関数群
- **テスト済み**: すべての関数に対して単体テストを実装

### 使用例

```javascript
import { isValidPlayerId, filterAlivePlayers } from '../core/common';

// プレイヤーIDの検証
if (!isValidPlayerId(playerId)) {
  throw new Error('無効なプレイヤーID');
}

// 生存プレイヤーのフィルタリング
const alivePlayers = filterAlivePlayers(players);

// 投票結果の集計
const voteCounts = countVotes(votes);
const maxVoted = Object.entries(voteCounts)
  .reduce((max, [id, count]) => (
    count > max.count ? { id, count } : max
  ), { id: null, count: 0 }).id;
```

## モジュール間の連携

コアモジュール間の連携は以下のように行われます：

- **EventSystem + ErrorSystem**: エラー発生時にイベントを発火
- **ErrorSystem + Common/Utils**: バリデーション関数を使用したエラーチェック
- **EventSystem + ドメインモジュール**: ゲーム状態変更の通知
- **ErrorSystem + ドメインモジュール**: ドメイン固有のエラー処理

## 依存関係

コアモジュールの依存関係は以下の通りです：

```
ErrorSystem → EventSystem
Common/Utils → (独立)
```

## ファイル構造

```
src/
├── core/
│   ├── event/
│   │   ├── __tests__/
│   │   │   └── EventSystem.test.js
│   │   ├── EventSystem.js
│   │   └── index.js
│   ├── error/
│   │   ├── __tests__/
│   │   │   ├── ErrorSystem.test.js
│   │   │   ├── ErrorCatalog.test.js
│   │   │   └── Validator.test.js
│   │   ├── ErrorCatalog.js
│   │   ├── ErrorHandler.js
│   │   ├── Validator.js
│   │   └── index.js
│   └── common/
│       ├── __tests__/
│       │   └── utils.test.js
│       ├── utils.js
│       └── index.js
```
