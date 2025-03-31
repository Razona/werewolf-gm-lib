# 人狼ゲーム役職プラグイン設計仕様書

## 1. 概要

役職プラグインシステムは、人狼ゲームGM支援ライブラリの拡張性を高めるための重要な機能です。このシステムにより、ライブラリの利用者は標準役職以外のカスタム役職を容易に追加できます。

## 2. プラグインの基本構造

```javascript
{
  // 基本情報
  id: "fortune_teller",           // システム内部での一意識別子（英数字とアンダースコアのみ）
  name: "fortune_teller",         // 役職名（英語）
  displayName: "占い師",          // 表示名（ローカライズ対応）
  team: "village",               // 所属陣営
  
  // メタデータ
  metadata: {
    description: "夜に一人を占い、人狼かどうかを知ることができる役職です",  // 役職の説明
    abilityDescription: "夜フェーズに1人を選んで占うことができます",        // 能力の説明
    icon: "crystal_ball",        // アイコン識別子（オプション）
    originalAuthor: "standard",  // 役職の作者（オプション）
    version: "1.0.0",            // バージョン（オプション）
    tags: ["standard", "seer"]   // 分類タグ（オプション）
  },
  
  // 勝利条件（第三陣営の場合必須）
  winCondition: {
    priority: 70,                // 勝利判定の優先度（高いほど優先）
    condition: Function,         // 勝利条件判定関数
    description: "〇〇の条件を満たした場合に勝利",  // 勝利条件の説明
    teamOnly: false              // true: 同じ陣営全員勝利、false: 個人勝利
  },
  
  // 能力関連
  abilities: [{
    id: "fortune",              // 能力ID
    type: "night_action",       // 能力種別（night_action, day_action, passive等）
    timing: "night",            // 使用タイミング
    targetType: "single_player", // 対象種別（single_player, multiple_players, self, none等）
    usageLimit: null,           // 使用回数制限（nullは無制限）
    cooldown: 0,                // クールダウン（0は制限なし）
    priority: 100,              // 実行優先度（高いほど早く実行）
    handler: Function           // 能力実行ハンドラー関数
  }],
  
  // イベントハンドラー
  eventHandlers: {
    "player.targeted.attack": Function,  // 襲撃対象になった場合
    "player.targeted.fortune": Function, // 占い対象になった場合
    "player.death": Function,           // 死亡時の処理
    "game.start": Function,             // ゲーム開始時の処理
    "phase.start.night": Function       // 夜フェーズ開始時の処理
  },
  
  // 特殊状態
  states: {
    fortuneResult: "white",      // 占い結果（white/black）
    mediumResult: "white",       // 霊媒結果（white/black）
    attackResistance: false,     // 襲撃耐性の有無
    canBeAttacked: true,         // 襲撃可能かどうか
    canBeExiled: true,           // 追放可能かどうか
    deathEffect: null            // 死亡時の特殊効果
  },
  
  // 依存関係
  dependencies: {
    roles: ["werewolf"],         // 依存する役職
    plugins: [],                 // 依存するプラグイン
    conflicts: []                // 競合するプラグイン
  },
  
  // カスタムデータ（拡張用）
  customData: {}
}
```

## 3. 必須および推奨要素

### 3.1 必須要素

- **id**: システム内で一意の識別子
- **name**: 役職名（英語、システム内部で使用）
- **displayName**: 表示名
- **team**: 所属陣営

### 3.2 特定条件で必須

- **winCondition**: 第三陣営の場合は必須
- **abilities**: 能動的な能力がある場合は必須
- **eventHandlers**: 特定のイベントに反応する場合は必須

### 3.3 強く推奨

- **metadata.description**: 役職の説明
- **states.fortuneResult**: 占い結果
- **states.mediumResult**: 霊媒結果
- **dependencies**: 他の役職への依存関係

## 4. 陣営の定義

```javascript
// 標準陣営
const TEAMS = {
  VILLAGE: "village",       // 村人陣営
  WEREWOLF: "werewolf",     // 人狼陣営
  NEUTRAL: "neutral",       // 中立陣営
  THIRD_PARTY: "third_party" // 第三陣営
};

// 陣営の拡張も可能
// "lovers", "cult" などのカスタム陣営
```

## 5. 役職能力の詳細仕様

### 5.1 能力タイプ

```javascript
// 能力タイプの例
const ABILITY_TYPES = {
  NIGHT_ACTION: "night_action",    // 夜の能動的行動
  DAY_ACTION: "day_action",        // 昼の能動的行動
  PASSIVE: "passive",              // 常時発動の受動的能力
  TRIGGERED: "triggered",          // 特定条件で発動する能力
  VOTE_MODIFIER: "vote_modifier",  // 投票に影響する能力
  CONDITIONAL: "conditional"       // 条件付きで発動する能力
};
```

### 5.2 能力ハンドラー関数

```javascript
// 能力ハンドラーの例（占い能力）
function fortuneAbilityHandler(context) {
  const { actor, target, game } = context;
  
  // ターゲットの役職を取得
  const targetRole = game.getPlayerRole(target);
  
  // 占い結果を取得
  const result = targetRole.states.fortuneResult;
  
  // 結果をアクターに通知
  game.sendActionResult(actor, {
    type: 'fortune',
    target,
    result
  });
  
  // 対象が特殊処理を持つ場合（例：妖狐の呪殺）
  if (targetRole.eventHandlers["player.targeted.fortune"]) {
    targetRole.eventHandlers["player.targeted.fortune"]({
      actor,
      target,
      result,
      game
    });
  }
  
  return { success: true, result };
}
```

## 6. イベントハンドラーの詳細仕様

### 6.1 主要なイベント

```javascript
// 役職が反応できる主要イベント
const ROLE_EVENTS = {
  // プレイヤー関連
  "player.targeted.attack": "襲撃対象になった時",
  "player.targeted.fortune": "占い対象になった時",
  "player.targeted.guard": "護衛対象になった時",
  "player.death": "死亡した時",
  "player.vote": "投票する時",
  "player.voted": "投票された時",
  
  // ゲーム進行関連
  "game.start": "ゲーム開始時",
  "game.end": "ゲーム終了時",
  "phase.start.night": "夜フェーズ開始時",
  "phase.end.night": "夜フェーズ終了時",
  "phase.start.day": "昼フェーズ開始時",
  "phase.start.vote": "投票フェーズ開始時"
};
```

### 6.2 イベントハンドラーの実装例

```javascript
// 妖狐の占い対象イベントハンドラー（呪殺機能）
const foxFortuneHandler = function(context) {
  const { actor, target, game } = context;
  
  // 呪殺効果を設定
  game.addPlayerEffect(target, {
    type: "cursed",
    source: actor,
    duration: 1, // 次のフェーズで発動
    onExpire: () => {
      // 対象を死亡させる
      game.killPlayer(target, "curse");
      
      // 呪殺イベント発火
      game.eventSystem.emit("player.death.curse", {
        player: target,
        source: actor
      });
    }
  });
  
  return { handled: true };
};
```

## 7. 特殊状態の詳細仕様

### 7.1 占い・霊媒結果

```javascript
// 占い/霊媒結果の種類
const FORTUNE_RESULTS = {
  WHITE: "white",       // 村人判定
  BLACK: "black",       // 人狼判定
  GRAY: "gray",         // 曖昧判定（特殊）
  ERROR: "error"        // エラー（占いが失敗する場合など）
};
```

### 7.2 襲撃耐性の実装

```javascript
// 襲撃耐性の例（妖狐）
const foxAttackHandler = function(context) {
  const { target, game } = context;
  
  // 襲撃を無効化
  return { 
    handled: true,      // イベントを処理した
    canceled: true,     // アクションを無効化
    message: "妖狐は襲撃に耐性があるため、無効化されました"
  };
};
```

## 8. 勝利条件の詳細仕様

### 8.1 勝利条件関数

```javascript
// 勝利条件関数の例（恋人陣営）
function loversWinCondition(gameState) {
  // 生存プレイヤーを取得
  const alivePlayers = gameState.getAlivePlayers();
  
  // 恋人役職を持つプレイヤーを検索
  const lovers = alivePlayers.filter(
    player => player.role.states.isLover === true
  );
  
  // 条件判定: 恋人が2人以上生存し、それ以外の生存者がいない
  if (lovers.length >= 2 && lovers.length === alivePlayers.length) {
    return {
      satisfied: true,             // 勝利条件を満たす
      winningTeam: "lovers",       // 勝利陣営
      winners: lovers.map(p => p.id), // 勝者リスト
      reason: "恋人たちだけが生き残った" // 勝利理由
    };
  }
  
  return { satisfied: false };    // 条件を満たさない
}
```

### 8.2 勝利優先度

複数の勝利条件が同時に満たされた場合、優先度の高い方が適用されます。一般的には：

```
100: 村人陣営（狼全滅）
90: 人狼陣営（村人数≦狼数）
80: 妖狐（生存していれば勝利）
70: 恋人陣営
60: その他の第三陣営
```

## 9. 役職の登録と使用

### 9.1 役職の登録

```javascript
// カスタム役職の登録例
werewolf.registerRole({
  id: "bomberman",
  name: "bomberman",
  displayName: "爆弾魔",
  team: "neutral",
  metadata: {
    description: "死亡時に自分に投票したプレイヤーを道連れにする",
  },
  states: {
    fortuneResult: "white",
    mediumResult: "white",
  },
  eventHandlers: {
    "player.death": function(context) {
      // 死亡時に投票者を道連れにする処理
      const { player, game, cause } = context;
      
      if (cause === "execution") {
        // 自分に投票したプレイヤーを取得
        const voters = game.getVotersFor(player.id);
        
        // 各投票者に爆発効果を適用
        voters.forEach(voterId => {
          game.killPlayer(voterId, "explosion");
        });
      }
    }
  }
});
```

### 9.2 役職の使用

```javascript
// ゲーム作成時に役職を指定
const game = werewolf.createGame({
  roles: ["villager", "werewolf", "seer", "bomberman"]
});
```

## 10. 制約と制限事項

### 10.1 技術的制約

- 役職IDは一意で、英数字とアンダースコアのみ使用可能
- 能力ハンドラーやイベントハンドラーは純粋なJavaScript関数である必要がある
- カスタムデータのシリアライズを考慮する（関数は保存不可）

### 10.2 ゲームバランス上の制約

- 一部の強力な役職は人数制限を設けるべき
- 勝利条件が競合する役職の組み合わせには注意
- 依存関係を考慮して自動でロールセットを調整する機能が必要

### 10.3 推奨される追加プロパティ

- **visibilityRules**: 役職情報の開示ルール
- **recommendedPlayerCount**: 推奨プレイヤー数
- **compatibleRolesets**: 組み合わせ推奨役職セット

## 11. 役職プラグインの検証とテスト方法

役職プラグインの登録時には、以下の検証を行います：

1. 必須プロパティの存在確認
2. 依存役職の存在確認
3. IDの一意性確認
4. 機能の実行テスト
5. 勝利条件の整合性確認

この詳細仕様に基づき、標準役職とカスタム役職を一貫した方法で実装し、プラグインシステムとして拡張可能にします。
