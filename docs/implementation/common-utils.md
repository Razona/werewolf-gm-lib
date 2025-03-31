# 人狼ゲームGM支援ライブラリ Common/Utils モジュール設計書

## 1. 概要

Common/Utilsモジュールは、人狼ゲームGM支援ライブラリの基盤となる共通ユーティリティ関数を提供します。
このモジュールはライブラリ全体で使用される基本的な機能を集約し、コードの重複を避け、一貫した実装を促進します。

## 2. 目的と役割

- **コード共有**: 複数のモジュールで使用される機能を一箇所に集約
- **標準化**: 共通の処理パターンを標準化し、一貫した実装を促進
- **効率性**: 共通の処理を最適化して全体のパフォーマンスを向上
- **ライブラリ依存の最小化**: 外部ライブラリへの依存を最小限に抑える

## 3. 機能カテゴリ

Common/Utilsモジュールは以下の機能カテゴリで構成されています：

### 3.1 バリデーション関数

```javascript
// プレイヤーIDの検証
function isValidPlayerId(id) {
  return typeof id === 'number' && id >= 0 && Number.isInteger(id);
}

// 役職名の検証
function isValidRoleName(roleName, availableRoles) {
  return typeof roleName === 'string' && availableRoles.includes(roleName);
}

// フェーズ名の検証
function isValidPhase(phase, allowedPhases) {
  return typeof phase === 'string' && (!allowedPhases || allowedPhases.includes(phase));
}

// アクションの検証
function isValidAction(action, allowedActions) {
  return action && typeof action.type === 'string' && 
         (!allowedActions || allowedActions.includes(action.type));
}
```

これらの関数は、入力値の検証と早期エラー検出に使用されます。特にプレイヤーID、役職名、フェーズ名、アクションタイプなど、ゲームの基本的な要素の妥当性を検証します。

### 3.2 コレクション操作

```javascript
// 生存プレイヤーのフィルタリング
function filterAlivePlayers(players) {
  return players.filter(player => player.isAlive);
}

// 特定の役職を持つプレイヤーの検索
function findPlayersByRole(players, roleName) {
  return players.filter(player => player.role && player.role.name === roleName);
}

// 投票結果の集計
function countVotes(votes) {
  const counts = {};
  votes.forEach(vote => {
    counts[vote.targetId] = (counts[vote.targetId] || 0) + 1;
  });
  return counts;
}
```

これらの関数は、プレイヤーリストや投票データなどのコレクションを操作するための便利なヘルパーです。

### 3.3 ゲームロジック

```javascript
// 役職配布ヘルパー
function distributeRoles(roles, playerIds) {
  const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
  const distribution = {};
  
  playerIds.forEach((playerId, index) => {
    distribution[playerId] = shuffledRoles[index % shuffledRoles.length];
  });
  
  return distribution;
}

// 同数得票の処理（ランダム選出）
function selectRandomTiedPlayer(tiedPlayers) {
  const index = Math.floor(Math.random() * tiedPlayers.length);
  return tiedPlayers[index];
}
```

これらの関数は、役職配布や投票同数処理など、ゲーム特有のロジックを提供します。

### 3.4 一般ユーティリティ

```javascript
// 配列からランダムに要素を選択
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 一意のIDを生成
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
```

これらの関数は、乱数生成やID生成などの一般的なユーティリティを提供します。

### 3.5 イベント処理

```javascript
// イベント名の解析
function parseEventName(eventName) {
  return eventName.split('.');
}

// イベント名のマッチング
function eventNameMatches(eventName, pattern) {
  const eventParts = parseEventName(eventName);
  const patternParts = parseEventName(pattern);
  
  if (patternParts.length > eventParts.length) return false;
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] !== '*' && patternParts[i] !== eventParts[i]) {
      return false;
    }
  }
  
  return true;
}
```

これらの関数は、イベントシステムでのイベント名の解析とパターンマッチングを支援します。

## 4. インターフェースと使用方法

### 4.1 モジュールのエクスポート形式

```javascript
// 個別のエクスポート
export function isValidPlayerId(id) { ... }
export function isValidRoleName(roleName, availableRoles) { ... }
// ... その他の関数 ...

// デフォルトエクスポート
export default {
  // バリデーション
  isValidPlayerId,
  isValidRoleName,
  isValidPhase,
  isValidAction,
  
  // コレクション操作
  filterAlivePlayers,
  findPlayersByRole,
  countVotes,
  
  // ゲームロジック
  distributeRoles,
  selectRandomTiedPlayer,
  
  // 一般ユーティリティ
  randomElement,
  generateUniqueId,
  
  // イベント処理
  parseEventName,
  eventNameMatches
};
```

### 4.2 インポート方法

```javascript
// モジュール全体をインポート
import utils from '../core/common';

// 必要な関数のみをインポート
import { isValidPlayerId, filterAlivePlayers } from '../core/common';
```

### 4.3 使用例

```javascript
// バリデーション例
if (!isValidPlayerId(playerId)) {
  throw new Error('無効なプレイヤーID');
}

// フィルタリング例
const alivePlayers = filterAlivePlayers(players);

// 役職配布例
const roleAssignments = distributeRoles(['villager', 'werewolf', 'seer'], [1, 2, 3, 4, 5]);

// イベントマッチング例
if (eventNameMatches('game.phase.start', 'game.*')) {
  // パターンにマッチするイベント処理
}
```

## 5. 実装戦略

### 5.1 実装原則

- **純粋関数**: 副作用のない純粋な関数として実装
- **型チェック**: 引数の型を厳密にチェックして堅牢性を確保
- **軽量性**: パフォーマンスを考慮した軽量な実装
- **明確なドキュメント**: 各関数には明確なJSDocコメントを付与

### 5.2 外部依存の扱い

外部ライブラリへの依存は最小限に抑え、標準のJavaScript機能を最大限に活用します。
ユーティリティ関数で標準のJavaScript機能では不十分な場合のみ、必要に応じて独自実装を検討します。

### 5.3 拡張と進化

Common/Utilsモジュールは、他のモジュールの開発に伴って段階的に拡張されます：

1. **初期実装**: バリデーションと基本的なユーティリティをまず実装
2. **継続的な拡張**: 他のモジュール開発中に必要となる共通機能を随時追加
3. **リファクタリング**: 使用パターンの分析に基づいて、定期的に最適化と再構成

## 6. 今後の開発における関わり方

### 6.1 新機能の追加

Common/Utilsモジュールに新しい関数を追加する際は、以下の手順に従います：

1. **必要性の確認**: 複数のモジュールで使用される機能かどうかを確認
2. **インターフェース設計**: 引数と戻り値を明確に定義
3. **テスト作成**: 関数の動作を検証するテストケースを作成
4. **実装**: テストを満たす実装を行う
5. **ドキュメント**: JSDocコメントでインターフェースを文書化

### 6.2 既存機能の利用

既存のモジュールからCommon/Utilsの機能を使用する際は、以下のベストプラクティスに従います：

1. **必要な関数のみをインポート**: モジュール全体ではなく、必要な関数のみをインポート
2. **早期検証**: バリデーション関数を使用して、早期にエラーを検出
3. **一貫した使用**: 同じ機能には常に同じユーティリティ関数を使用
4. **フィードバック**: 改善点や追加したい機能があれば報告

### 6.3 テスト

Common/Utilsモジュールの各関数は、包括的なテストで品質を確保します：

1. **ユニットテスト**: 各関数の基本動作を検証
2. **エッジケース**: 極端な入力や境界条件のテスト
3. **型チェック**: 異なる型の入力に対する動作検証
4. **パフォーマンス**: 大きな入力データに対するパフォーマンスチェック

## 7. ファイル構造

```
src/
└── core/
    └── common/
        ├── __tests__/
        │   └── utils.test.js     # テストケース
        ├── utils.js              # 実装ファイル
        └── index.js              # エクスポート定義
```

## 8. 結論

Common/Utilsモジュールは、人狼ゲームGM支援ライブラリの基盤として、共通の機能を提供します。このモジュールを効果的に活用することで、コードの重複を減らし、一貫性のある実装を促進します。

初期の基本実装に加えて、他のモジュールの開発を進める過程で必要な機能を段階的に追加していくことで、プロジェクトのニーズに合わせて進化させていきます。モジュール間の共通パターンが発見された場合は、積極的にCommon/Utilsモジュールに抽出し、再利用を促進していきましょう。
