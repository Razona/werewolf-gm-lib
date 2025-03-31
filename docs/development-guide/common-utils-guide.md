# Common/Utils モジュール 開発ガイド

## 概要

このガイドでは、人狼ゲームGM支援ライブラリの開発において、Common/Utilsモジュールを効果的に活用し、拡張する方法について説明します。

## 1. ユーティリティ関数活用のベストプラクティス

### 1.1 適切なインポート方法

```javascript
// 良い例: 必要な関数だけをインポート
import { isValidPlayerId, filterAlivePlayers } from '../core/common';

// 避けるべき例: 全てインポートするのは非効率
import * as utils from '../core/common';
```

### 1.2 バリデーション関数の活用

各モジュールの処理開始時に、入力値を検証することで早期にエラーを検出しましょう。

```javascript
// 良い例: 早期バリデーション
function processPlayer(playerId) {
  if (!isValidPlayerId(playerId)) {
    throw new Error('無効なプレイヤーID');
  }
  
  // 以降の処理...
}
```

### 1.3 コレクション操作の標準化

プレイヤーリストや投票データなどのコレクション操作には、Common/Utilsの関数を一貫して使用しましょう。

```javascript
// 良い例: 標準化されたフィルタリング
const alivePlayers = filterAlivePlayers(players);
const seers = findPlayersByRole(players, 'seer');

// 避けるべき例: 独自実装によるフィルタリング
const alivePlayers = players.filter(p => p.isAlive === true);
```

## 2. モジュール拡張ガイド

### 2.1 新機能の追加検討フロー

新しいユーティリティ関数を追加する前に、以下の点を検討しましょう：

1. **複数モジュールでの使用**: 本当に複数のモジュールで使用される機能か？
2. **一般性**: 特定のコンテキストに依存せず、汎用的に使用できるか？
3. **既存機能との重複**: 既存の関数で対応できないか？
4. **標準JS機能**: JavaScriptの標準機能で対応できないか？

### 2.2 新機能の追加手順

1. **テストの作成**: まず、機能の要件を明確にするテストを作成
2. **関数の実装**: テストを満たす最小限の実装を作成
3. **ドキュメント**: JSDocコメントでインターフェースを明確に文書化
4. **index.jsの更新**: モジュールのエクスポートリストに新関数を追加

```javascript
// 新機能の実装例（utils.js）
/**
 * プレイヤーが特定の状態効果を持っているか確認
 * @param {Object} player - プレイヤーオブジェクト
 * @param {string} effectType - 確認する状態効果のタイプ
 * @returns {boolean} 状態効果を持っていればtrue
 */
export function hasStatusEffect(player, effectType) {
  if (!player || !Array.isArray(player.statusEffects)) {
    return false;
  }
  
  return player.statusEffects.some(effect => effect.type === effectType);
}

// index.jsへの追加
export { hasStatusEffect } from './utils';
// デフォルトエクスポートにも追加
```

### 2.3 テスト作成ガイドライン

新機能のテストでは、以下のケースをカバーしましょう：

1. **正常系**: 想定通りの入力での動作
2. **異常系**: 無効な入力（null、undefinedなど）での動作
3. **境界条件**: 極端なケース（空配列、最大値など）
4. **型バリエーション**: 異なる型の入力での動作

```javascript
// テスト例
describe('hasStatusEffect', () => {
  test('should return true when player has the status effect', () => {
    const player = {
      statusEffects: [{ type: 'guarded', value: true }]
    };
    expect(hasStatusEffect(player, 'guarded')).toBe(true);
  });
  
  test('should return false when player does not have the status effect', () => {
    const player = {
      statusEffects: [{ type: 'poisoned', value: true }]
    };
    expect(hasStatusEffect(player, 'guarded')).toBe(false);
  });
  
  test('should handle null or undefined player', () => {
    expect(hasStatusEffect(null, 'guarded')).toBe(false);
    expect(hasStatusEffect(undefined, 'guarded')).toBe(false);
  });
  
  test('should handle player without statusEffects', () => {
    const player = { id: 1 };
    expect(hasStatusEffect(player, 'guarded')).toBe(false);
  });
});
```

## 3. モジュールごとの活用指針

### 3.1 PlayerModelでの活用

PlayerModelでは、以下のCommon/Utils関数が特に有用です：

- `isValidPlayerId`: プレイヤーIDの検証
- `filterAlivePlayers`: 生存プレイヤーのフィルタリング
- `generateUniqueId`: 一意のID生成（プレイヤー追加時）

```javascript
class PlayerManager {
  getAlivePlayers() {
    return filterAlivePlayers(Array.from(this.players.values()));
  }
  
  getPlayer(playerId) {
    if (!isValidPlayerId(playerId)) {
      throw new Error('無効なプレイヤーID');
    }
    return this.players.get(playerId);
  }
}
```

### 3.2 RoleModelでの活用

RoleModelでは、以下の関数が有用です：

- `isValidRoleName`: 役職名の検証
- `findPlayersByRole`: 特定の役職を持つプレイヤーの検索
- `distributeRoles`: 役職の配布

```javascript
class RoleManager {
  assignRole(playerId, roleName) {
    if (!isValidRoleName(roleName, this.availableRoles)) {
      throw new Error('無効な役職名');
    }
    
    // 役職の割り当て処理...
  }
  
  getPlayersByRole(roleName) {
    return findPlayersByRole(this.game.getAllPlayers(), roleName);
  }
}
```

### 3.3 VoteModelでの活用

VoteModelでは、以下の関数が有用です：

- `countVotes`: 投票の集計
- `selectRandomTiedPlayer`: 同数得票時のランダム選択

```javascript
class VoteManager {
  countVotes() {
    const votes = this.getCurrentVotes();
    const counts = countVotes(votes);
    
    // 最多得票者の特定
    let maxCount = 0;
    let maxVoted = [];
    
    for (const [targetId, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxVoted = [parseInt(targetId)];
      } else if (count === maxCount) {
        maxVoted.push(parseInt(targetId));
      }
    }
    
    return { counts, maxVoted, isTie: maxVoted.length > 1 };
  }
  
  resolveOnTie(tiedPlayers, tieRule) {
    if (tieRule === 'random') {
      return selectRandomTiedPlayer(tiedPlayers);
    }
    // その他のルール処理...
  }
}
```

### 3.4 PhaseModelでの活用

PhaseModelでは、以下の関数が有用です：

- `isValidPhase`: フェーズ名の検証
- `eventNameMatches`: フェーズイベントのマッチング

```javascript
class PhaseManager {
  moveToPhase(targetPhase) {
    if (!isValidPhase(targetPhase, this.allowedPhases)) {
      throw new Error('無効なフェーズ名');
    }
    
    // フェーズ遷移処理...
  }
  
  handleEvent(eventName, data) {
    if (eventNameMatches(eventName, 'phase.start.*')) {
      // フェーズ開始イベントの処理
    } else if (eventNameMatches(eventName, 'phase.end.*')) {
      // フェーズ終了イベントの処理
    }
  }
}
```

## 4. 開発時の注意点

### 4.1 パフォーマンスへの考慮

- 大量のデータを扱う操作（フィルタリングなど）では、パフォーマンスに注意
- ループの中で同じ計算を繰り返さないよう、結果をキャッシュ
- 早期リターンパターンを使い、不要な処理を減らす

```javascript
// パフォーマンスを考慮した例
function findPlayersByMultipleRoles(players, roleNames) {
  // roleNamesが空の場合は早期リターン
  if (!roleNames || roleNames.length === 0) return [];
  
  // Set化して検索を高速化
  const roleSet = new Set(roleNames);
  
  return players.filter(player => 
    player.role && roleSet.has(player.role.name)
  );
}
```

### 4.2 型の一貫性

- 引数と戻り値の型を一貫させる
- 暗黙の型変換に依存せず、明示的に型を扱う
- 入力が期待と異なる場合のフォールバック値を考慮

```javascript
// 型の一貫性を考慮した例
function countVotesByTarget(votes, targetId) {
  // targetIdを数値に変換（入力が文字列でも対応）
  const normalizedTargetId = parseInt(targetId, 10);
  
  // targetIdが無効な場合は早期リターン
  if (isNaN(normalizedTargetId)) return 0;
  
  return votes.filter(vote => vote.targetId === normalizedTargetId).length;
}
```

### 4.3 拡張性の確保

- 将来の要件変更を見据えたインターフェース設計
- オプションパラメータによる柔軟な挙動
- 追加の機能を容易に統合できる構造

```javascript
// 拡張性を考慮した例
function filterPlayers(players, criteria = {}) {
  return players.filter(player => {
    // 生存状態でフィルタリング（criteria.aliveが未指定なら無視）
    if (criteria.alive !== undefined && player.isAlive !== criteria.alive) {
      return false;
    }
    
    // 役職でフィルタリング（criteria.roleが未指定なら無視）
    if (criteria.role && (!player.role || player.role.name !== criteria.role)) {
      return false;
    }
    
    // 状態効果でフィルタリング（criteria.effectが未指定なら無視）
    if (criteria.effect && !hasStatusEffect(player, criteria.effect)) {
      return false;
    }
    
    // 将来の条件を追加しやすい
    
    return true;
  });
}
```

## 5. 最終的なベストプラクティス

1. **モジュール間の共通パターンに注目**: 複数のモジュールで同じパターンを発見したら、Common/Utilsへの抽出を検討
2. **標準化を優先**: 独自実装より標準化されたユーティリティの使用を優先
3. **テストを重視**: 新機能の追加は必ずテスト駆動で行う
4. **段階的な成長**: 一度にすべての機能を実装するのではなく、必要に応じて段階的に拡張
5. **定期的なレビュー**: 機能の重複や非効率な実装がないか定期的にレビュー

Common/Utilsモジュールを効果的に活用し、一貫性のある堅牢な実装を目指しましょう。
