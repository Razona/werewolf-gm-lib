# 人狼ゲームGM支援ライブラリ 勝利条件判定システム設計書

## 1. 概要

本設計書では、人狼ゲームGM支援ライブラリの勝利条件判定システムについて詳細に定義します。勝利条件判定システムは、ゲームの進行状況を監視し、各陣営の勝利条件達成を判定するコンポーネントです。村人陣営、人狼陣営、妖狐陣営など各陣営の勝利条件を定義し、さらに将来的な拡張に対応できる柔軟な設計を提供します。

## 2. 設計目標

- **正確性**: 勝利条件の判定が正確かつ一貫して行われる
- **透明性**: 勝利条件と判定過程が明確で理解しやすい
- **柔軟性**: 様々な陣営や特殊な勝利条件に対応できる設計
- **拡張性**: 新しい陣営や勝利条件の追加が容易な構造
- **イベント連携**: 他のシステムコンポーネントとの緊密な連携

## 3. 勝利条件の表現方法

### 3.1 勝利条件の基本構造

勝利条件は以下の構造で表現します：

```javascript
{
  id: "village_win",           // 勝利条件ID
  team: "village",             // 関連する陣営
  displayName: "村人陣営勝利", // 表示名
  description: "人狼が全滅した", // 説明文
  condition: Function,         // 判定関数
  priority: 100,               // 複数条件が同時に満たされた場合の優先度
  metadata: {}                 // 追加情報
}
```

### 3.2 勝利条件判定関数

勝利条件の判定は関数として表現します：

```javascript
// 勝利条件判定関数の型
type VictoryConditionFunction = (game: Game) => {
  satisfied: boolean,     // 条件が満たされたか
  winningTeam?: string,   // 勝利した陣営（満たされた場合）
  reason?: string,        // 勝利理由
  winningPlayers?: number[], // 勝利したプレイヤーID（オプション）
  metadata?: any          // 追加情報
}
```

### 3.3 複合条件の表現

複数の条件が組み合わさった複合的な勝利条件も表現できます：

```javascript
// 複合条件の例
{
  id: "custom_win",
  team: "custom_team",
  displayName: "カスタム陣営勝利",
  description: "特殊な勝利条件を達成",
  // 複数の条件をAND/ORで結合
  condition: {
    type: "AND", // すべての条件を満たす必要がある
    conditions: [
      {
        type: "PLAYER_COUNT",
        team: "custom_team", 
        operator: ">=",
        count: 1
      },
      {
        type: "PLAYER_COUNT",
        team: "werewolf",
        operator: "==",
        count: 0
      }
    ]
  },
  priority: 80
}
```

## 4. 陣営ごとの勝利条件

### 4.1 村人陣営の勝利条件

村人陣営は全ての人狼が排除された時点で勝利します。

```javascript
{
  id: "village_win",
  team: "village",
  displayName: "村人陣営勝利",
  description: "全ての人狼を追放することに成功した",
  condition: (game) => {
    // 人狼が存在しないか確認
    const werewolves = game.getAlivePlayers().filter(
      player => player.role.team === "werewolf" && 
                player.role.name === "werewolf"
    );
    
    return {
      satisfied: werewolves.length === 0,
      winningTeam: "village",
      reason: "全ての人狼が追放された"
    };
  },
  priority: 100
}
```

### 4.2 人狼陣営の勝利条件

人狼陣営は村人判定のプレイヤー（狂人を含む）の数が人狼と同数以下になった時点で勝利します。

```javascript
{
  id: "werewolf_win",
  team: "werewolf",
  displayName: "人狼陣営勝利",
  description: "村人陣営の数が人狼陣営と同数以下になった",
  condition: (game) => {
    const alivePlayers = game.getAlivePlayers();
    
    // 生存している人狼の数
    const werewolves = alivePlayers.filter(
      player => player.role.name === "werewolf"
    );
    
    // 生存している村人判定のプレイヤー（村人陣営 + 第三陣営で村人判定）
    const villageSidePlayers = alivePlayers.filter(player => {
      // 人狼陣営でも狂人は村人判定
      if (player.role.name === "werewolf") return false;
      
      // 占い結果が黒の役職は除外
      return player.role.getFortuneResult() === "white";
    });
    
    return {
      satisfied: werewolves.length > 0 && 
                 villageSidePlayers.length <= werewolves.length,
      winningTeam: "werewolf",
      reason: "村人陣営の数が人狼陣営と同数以下になった"
    };
  },
  priority: 90
}
```

### 4.3 妖狐陣営の勝利条件

妖狐陣営は他の陣営の勝利条件が満たされた時点で生存していれば勝利します。

```javascript
{
  id: "fox_win",
  team: "fox",
  displayName: "妖狐陣営勝利",
  description: "勝利条件達成時に生存していた",
  // 特殊な生存確認条件
  condition: (game, victoryContext) => {
    // 他の陣営の勝利条件が満たされたかチェック
    const otherTeamWon = victoryContext && 
                         (victoryContext.winningTeam === "village" || 
                          victoryContext.winningTeam === "werewolf");
    
    if (!otherTeamWon) return { satisfied: false };
    
    // 妖狐が生存しているか確認
    const foxes = game.getAlivePlayers().filter(
      player => player.role.name === "fox"
    );
    
    return {
      satisfied: foxes.length > 0,
      winningTeam: "fox",
      reason: "他の陣営の勝利条件達成時に生存していた",
      // 勝利プレイヤーは妖狐と背徳者
      winningPlayers: game.getAlivePlayers()
        .filter(player => player.role.team === "fox")
        .map(player => player.id)
    };
  },
  priority: 80
}
```

### 4.4 共通の引き分け条件

特定の状況下では引き分けになる場合もあります：

```javascript
{
  id: "draw",
  team: null, // 引き分けは特定の陣営に属さない
  displayName: "引き分け",
  description: "勝利条件を満たす陣営がない",
  condition: (game, victoryContext) => {
    // すでに勝者が決まっている場合は引き分けにはならない
    if (victoryContext && victoryContext.winningTeam) {
      return { satisfied: false };
    }
    
    // 生存プレイヤーがいない場合は引き分け
    const alivePlayers = game.getAlivePlayers();
    if (alivePlayers.length === 0) {
      return {
        satisfied: true,
        winningTeam: "draw",
        reason: "生存者がいなくなった"
      };
    }
    
    // ゲームが進行不能な状態（例：人狼も村人もいない）
    const werewolves = alivePlayers.filter(p => p.role.name === "werewolf");
    const villagers = alivePlayers.filter(p => p.role.team === "village");
    
    if (werewolves.length === 0 && villagers.length === 0) {
      return {
        satisfied: true,
        winningTeam: "draw",
        reason: "ゲームの勝敗を決定できない状態になった"
      };
    }
    
    return { satisfied: false };
  },
  priority: 0 // 最低優先度
}
```

## 5. 勝利判定システムの設計

### 5.1 VictoryManager クラス設計

勝利条件判定を管理するコアクラスです：

```javascript
class VictoryManager {
  constructor(game) {
    this.game = game;
    this.victoryConditions = new Map(); // 勝利条件のリスト
    this.registeredTeams = new Set();   // 登録済み陣営
    this.gameResult = null;             // ゲーム結果
    
    // 標準の勝利条件を登録
    this.registerStandardVictoryConditions();
  }
  
  // 勝利条件の登録
  registerVictoryCondition(condition) { ... }
  
  // 勝利判定の実行
  checkVictoryConditions() { ... }
  
  // 特定の陣営の勝利条件を取得
  getTeamVictoryConditions(team) { ... }
  
  // カスタム勝利条件の登録
  registerCustomVictoryCondition(condition) { ... }
  
  // ゲーム結果の取得
  getGameResult() { ... }
  
  // ゲーム結果のリセット
  resetGameResult() { ... }
}
```

### 5.2 勝利判定のフロー

勝利判定は以下の流れで行われます：

```
1. イベントトリガー（プレイヤーの死亡、フェーズ終了など）
2. VictoryManager.checkVictoryConditions() を呼び出し
3. 登録されたすべての勝利条件を優先度順に評価
   a. 各勝利条件の判定関数を実行
   b. 条件が満たされているかチェック
4. 満たされた勝利条件があれば、最も優先度の高いものを選択
5. 勝利チームと理由を決定
6. 'victory.condition.met' イベントを発火
7. ゲーム終了フェーズへ移行
```

### 5.3 勝利判定メソッドの実装

```javascript
checkVictoryConditions() {
  // 既にゲーム結果が確定している場合はスキップ
  if (this.gameResult) return this.gameResult;
  
  // 判定前イベント発火
  this.game.eventSystem.emit('victory.check.before', {
    turn: this.game.phaseManager.getCurrentTurn(),
    phase: this.game.phaseManager.getCurrentPhase()
  });
  
  // 勝利条件を優先度順にソート
  const sortedConditions = [...this.victoryConditions.values()]
    .sort((a, b) => b.priority - a.priority);
  
  // コンテキスト情報（複合条件や相互依存条件のため）
  let victoryContext = null;
  
  // 各勝利条件をチェック
  for (const condition of sortedConditions) {
    // 勝利条件の評価
    const result = condition.condition(this.game, victoryContext);
    
    // 勝利条件が満たされた場合
    if (result.satisfied) {
      // 勝利コンテキストを更新（他の条件判定に影響する可能性）
      victoryContext = {
        ...result,
        conditionId: condition.id
      };
      
      // 勝者判定後イベント発火
      this.game.eventSystem.emit('victory.condition.met', {
        conditionId: condition.id,
        team: result.winningTeam,
        reason: result.reason,
        turn: this.game.phaseManager.getCurrentTurn(),
        winningPlayers: result.winningPlayers
      });
      
      // ゲーム結果の保存
      this.gameResult = {
        winningTeam: result.winningTeam,
        winningCondition: condition.id,
        reason: result.reason,
        turn: this.game.phaseManager.getCurrentTurn(),
        winningPlayers: result.winningPlayers || 
          this.getTeamPlayers(result.winningTeam),
        metadata: {
          ...condition.metadata,
          ...result.metadata
        }
      };
      
      // 最優先の条件が満たされたら終了
      break;
    }
  }
  
  // 判定後イベント発火
  this.game.eventSystem.emit('victory.check.after', {
    result: this.gameResult,
    turn: this.game.phaseManager.getCurrentTurn()
  });
  
  return this.gameResult;
}
```

## 6. 勝利判定のタイミング

### 6.1 標準判定タイミング

勝利条件のチェックは以下のタイミングで実行されます：

1. **プレイヤー死亡時**: プレイヤーが死亡するたびに勝利条件をチェック
2. **フェーズ終了時**: 各フェーズの終了時に勝利条件をチェック
3. **ターン終了時**: 各ターンの終了時に勝利条件をチェック
4. **特定アクション後**: 特定のアクション（例：処刑）の完了後にチェック

### 6.2 イベントリスナーの設定

```javascript
initializeEventListeners() {
  // プレイヤー死亡時
  this.game.eventSystem.on('player.death', (event) => {
    // 死亡したプレイヤーの情報
    const playerId = event.playerId;
    const cause = event.cause;
    
    // 勝利条件チェック
    this.checkVictoryConditions();
  });
  
  // フェーズ終了時
  this.game.eventSystem.on('phase.end', (event) => {
    // 勝利条件チェック
    this.checkVictoryConditions();
  });
  
  // 処刑実行後
  this.game.eventSystem.on('execution.after', (event) => {
    // 勝利条件チェック
    this.checkVictoryConditions();
  });
}
```

### 6.3 手動判定の提供

特定のタイミングで明示的に勝利判定を実行できる機能も提供します：

```javascript
// ゲームクラスのメソッド
checkWinCondition() {
  return this.victoryManager.checkVictoryConditions();
}

// 特殊な状況での判定
forceVictoryCheck(reason = 'manual') {
  const result = this.victoryManager.checkVictoryConditions();
  
  // 判定イベント発火
  this.eventSystem.emit('victory.check.forced', {
    result,
    reason,
    turn: this.phaseManager.getCurrentTurn()
  });
  
  return result;
}
```

## 7. イベントとの連携

### 7.1 発火するイベント

勝利条件判定システムは以下のイベントを発火します：

| イベント | 説明 | データ例 |
|---------|------|----------|
| `victory.check.before` | 勝利条件チェック開始時 | `{turn, phase}` |
| `victory.check.after` | 勝利条件チェック終了時 | `{result, turn}` |
| `victory.condition.met` | 勝利条件達成時 | `{conditionId, team, reason, turn, winningPlayers}` |
| `victory.declared` | 勝利宣言時 | `{winningTeam, reason, turn, players}` |
| `game.end` | ゲーム終了時 | `{result, duration, statistics}` |

### 7.2 購読するイベント

勝利条件判定システムは以下のイベントを購読します：

| イベント | 処理内容 |
|---------|----------|
| `player.death` | プレイヤー死亡時に勝利条件チェック |
| `phase.end` | フェーズ終了時に勝利条件チェック |
| `execution.after` | 処刑実行後に勝利条件チェック |
| `game.force.end` | 強制終了時に特殊な勝利条件処理 |

### 7.3 ゲーム終了処理との連携

勝利条件達成時のゲーム終了処理の流れ：

```javascript
// 勝利条件達成時の処理
onVictoryConditionMet(event) {
  // 既にゲームが終了している場合はスキップ
  if (this.isGameEnded) return;
  
  // 勝利宣言イベント発火
  this.eventSystem.emit('victory.declared', {
    winningTeam: event.team,
    reason: event.reason,
    turn: event.turn,
    players: event.winningPlayers
  });
  
  // ゲーム終了フェーズへ移行
  this.phaseManager.moveToPhase('gameEnd');
  
  // ゲーム終了処理
  this.endGame({
    winningTeam: event.team,
    reason: event.reason,
    conditionId: event.conditionId,
    duration: Date.now() - this.startTime,
    statistics: this.generateGameStatistics()
  });
}
```

## 8. カスタム勝利条件の拡張

### 8.1 カスタム勝利条件の登録

```javascript
// カスタム勝利条件の登録
registerCustomVictoryCondition(condition) {
  // 基本的な検証
  if (!condition.id || !condition.condition) {
    throw new Error('無効な勝利条件定義です');
  }
  
  // 既存条件の上書き確認
  if (this.victoryConditions.has(condition.id)) {
    console.warn(`勝利条件 ${condition.id} は上書きされます`);
  }
  
  // 条件の登録
  this.victoryConditions.set(condition.id, {
    ...condition,
    // デフォルト値の設定
    team: condition.team || 'custom',
    priority: condition.priority || 50,
    metadata: condition.metadata || {}
  });
  
  // 関連する陣営を登録
  if (condition.team) {
    this.registeredTeams.add(condition.team);
  }
  
  return true;
}
```

### 8.2 カスタム陣営の追加

```javascript
// カスタム陣営と勝利条件の追加例
addCustomTeam(teamId, displayName, victoryCondition) {
  // ロールマネージャに陣営を登録
  this.game.roleManager.registerTeam(teamId, {
    displayName,
    colorCode: victoryCondition.colorCode || '#808080',
    description: victoryCondition.description || `${displayName}陣営`
  });
  
  // 勝利条件を登録
  this.registerCustomVictoryCondition({
    id: `${teamId}_win`,
    team: teamId,
    displayName: `${displayName}陣営勝利`,
    description: victoryCondition.description || `${displayName}陣営の勝利条件を達成`,
    condition: victoryCondition.condition,
    priority: victoryCondition.priority || 50
  });
  
  return true;
}
```

### 8.3 宣言型の勝利条件定義

複雑なコードを書かずに勝利条件を定義できる宣言型のインターフェースも提供：

```javascript
// 宣言型の勝利条件定義例
registerDeclaredVictoryCondition({
  id: "lovers_win",
  team: "lovers",
  displayName: "恋人陣営勝利",
  description: "恋人たちだけが生き残った",
  // 宣言型定義
  declaredCondition: {
    type: "AND",
    conditions: [
      // 恋人が少なくとも2人生存
      {
        type: "PLAYER_COUNT",
        role: "lover", 
        operator: ">=",
        count: 2
      },
      // 恋人以外の生存者がいない
      {
        type: "PLAYER_COUNT",
        notRole: "lover",
        alive: true,
        operator: "==",
        count: 0
      }
    ]
  },
  priority: 70
})
```

### 8.4 条件コンバーター

宣言型定義から実行可能な判定関数に変換するコンバーター：

```javascript
// 宣言型条件から判定関数への変換
convertDeclaredCondition(declaredCondition) {
  // 単一条件の場合
  if (!declaredCondition.type) {
    return this.createSingleConditionFunction(declaredCondition);
  }
  
  // 複合条件の場合
  const conditions = declaredCondition.conditions.map(
    cond => this.convertDeclaredCondition(cond)
  );
  
  // AND条件
  if (declaredCondition.type === "AND") {
    return (game) => {
      for (const conditionFn of conditions) {
        const result = conditionFn(game);
        if (!result.satisfied) return { satisfied: false };
      }
      return { satisfied: true };
    };
  }
  
  // OR条件
  if (declaredCondition.type === "OR") {
    return (game) => {
      for (const conditionFn of conditions) {
        const result = conditionFn(game);
        if (result.satisfied) return result;
      }
      return { satisfied: false };
    };
  }
  
  throw new Error(`未サポートの条件タイプ: ${declaredCondition.type}`);
}
```

## 9. 特殊ケースへの対応

### 9.1 時間制限による強制終了

ゲームが時間制限で強制終了する場合の特殊勝利判定：

```javascript
// 時間制限による強制終了
handleTimeLimit() {
  // 現在の状態を分析
  const alivePlayers = this.game.getAlivePlayers();
  const aliveWerewolves = alivePlayers.filter(p => p.role.name === "werewolf");
  const aliveVillagers = alivePlayers.filter(p => p.role.team === "village");
  
  // 人狼の数が村人の数より多い場合は人狼陣営勝利
  if (aliveWerewolves.length > aliveVillagers.length) {
    return {
      winningTeam: "werewolf",
      reason: "時間制限による強制終了 - 人狼が村人より多い",
      conditionId: "time_limit"
    };
  }
  
  // 人狼と村人の数が同じ場合は人狼陣営勝利
  if (aliveWerewolves.length === aliveVillagers.length && aliveWerewolves.length > 0) {
    return {
      winningTeam: "werewolf",
      reason: "時間制限による強制終了 - 人狼と村人が同数",
      conditionId: "time_limit"
    };
  }
  
  // 人狼がいない場合は村人陣営勝利
  if (aliveWerewolves.length === 0 && aliveVillagers.length > 0) {
    return {
      winningTeam: "village",
      reason: "時間制限による強制終了 - 人狼が全滅",
      conditionId: "time_limit"
    };
  }
  
  // その他の場合は引き分け
  return {
    winningTeam: "draw",
    reason: "時間制限による強制終了",
    conditionId: "time_limit"
  };
}
```

### 9.2 全プレイヤー死亡

全プレイヤーが死亡した場合の特殊判定：

```javascript
// 全プレイヤー死亡時の判定
handleAllPlayersDead() {
  // 最後に死亡したプレイヤーの情報
  const lastDeath = this.game.getLastDeathInfo();
  
  // 死因に基づいた判定
  switch (lastDeath.cause) {
    // 処刑による場合
    case 'execution':
      // 引き分け
      return {
        winningTeam: "draw",
        reason: "全員処刑による引き分け",
        conditionId: "all_dead"
      };
    
    // 襲撃による場合
    case 'attack':
      // 人狼陣営勝利（最後のプレイヤーを襲撃した）
      return {
        winningTeam: "werewolf",
        reason: "全村人を襲撃した",
        conditionId: "all_villagers_dead"
      };
    
    // 呪殺による場合
    case 'curse':
      // 妖狐陣営は負け、村人陣営勝利
      return {
        winningTeam: "village",
        reason: "妖狐が呪殺された",
        conditionId: "fox_cursed"
      };
    
    // その他の死因
    default:
      // 引き分け
      return {
        winningTeam: "draw",
        reason: `全員死亡による引き分け (${lastDeath.cause})`,
        conditionId: "all_dead"
      };
  }
}
```

### 9.3 カスタムゲームモード

特定のゲームモードに対応するカスタム勝利条件：

```javascript
// カスタムゲームモード「恋人モード」
setupLoversGameMode() {
  // 恋人陣営を登録
  this.addCustomTeam("lovers", "恋人", {
    description: "恋人たちだけが生き残る",
    condition: (game) => {
      const alivePlayers = game.getAlivePlayers();
      
      // 恋人役職を持つプレイヤー
      const lovers = alivePlayers.filter(p => p.role.name === "lover");
      
      // 恋人が2人以上生存し、他のプレイヤーがいない場合に勝利
      if (lovers.length >= 2 && lovers.length === alivePlayers.length) {
        return {
          satisfied: true,
          winningTeam: "lovers",
          reason: "恋人たちだけが生き残った",
          winningPlayers: lovers.map(p => p.id)
        };
      }
      
      return { satisfied: false };
    },
    priority: 85
  });
  
  // 恋人の特殊死亡条件を設定
  this.game.roleManager.setRoleEffect("lover", {
    onPartnerDeath: (playerId, partnerId) => {
      // パートナーが死亡したら後追い
      this.game.killPlayer(playerId, "lover_suicide");
    }
  });
}
```

## 10. 勝利条件判定の共通パターン

### 10.1 プレイヤー数に基づく判定

```javascript
// 特定の役職/陣営のプレイヤー数に基づく判定
createPlayerCountCondition({
  role, team, alive = true, operator, count, excludeRoles = []
}) {
  return (game) => {
    // プレイヤーリストの取得
    const players = alive ? game.getAlivePlayers() : game.getAllPlayers();
    
    // フィルタリング条件の構築
    let filteredPlayers = players;
    
    if (role) {
      filteredPlayers = filteredPlayers.filter(p => p.role.name === role);
    }
    
    if (team) {
      filteredPlayers = filteredPlayers.filter(p => p.role.team === team);
    }
    
    if (excludeRoles.length > 0) {
      filteredPlayers = filteredPlayers.filter(p => !excludeRoles.includes(p.role.name));
    }
    
    // プレイヤー数
    const playerCount = filteredPlayers.length;
    
    // 条件式の評価
    let satisfied = false;
    switch (operator) {
      case '==': satisfied = playerCount === count; break;
      case '!=': satisfied = playerCount !== count; break;
      case '>': satisfied = playerCount > count; break;
      case '>=': satisfied = playerCount >= count; break;
      case '<': satisfied = playerCount < count; break;
      case '<=': satisfied = playerCount <= count; break;
      default: throw new Error(`未サポートの演算子: ${operator}`);
    }
    
    return { satisfied };
  };
}
```

### 10.2 相対的プレイヤー数に基づく判定

```javascript
// 2つの陣営の相対的なプレイヤー数に基づく判定
createRelativeCountCondition({
  teamA, teamB, operator
}) {
  return (game) => {
    // 生存プレイヤーの取得
    const alivePlayers = game.getAlivePlayers();
    
    // チームA所属プレイヤー
    const teamAPlayers = alivePlayers.filter(p => p.role.team === teamA);
    
    // チームB所属プレイヤー
    const teamBPlayers = alivePlayers.filter(p => p.role.team === teamB);
    
    // プレイヤー数
    const teamACount = teamAPlayers.length;
    const teamBCount = teamBPlayers.length;
    
    // 条件式の評価
    let satisfied = false;
    switch (operator) {
      case '==': satisfied = teamACount === teamBCount; break;
      case '>': satisfied = teamACount > teamBCount; break;
      case '>=': satisfied = teamACount >= teamBCount; break;
      case '<': satisfied = teamACount < teamBCount; break;
      case '<=': satisfied = teamACount <= teamBCount; break;
      default: throw new Error(`未サポートの演算子: ${operator}`);
    }
    
    return { satisfied };
  };
}
```

### 10.3 陣営間の関係に基づく判定

```javascript
// 狼vs村人の人数比較による判定（人狼陣営判定の基本）
createWerewolfVsVillageCondition() {
  return (game) => {
    const alivePlayers = game.getAlivePlayers();
    
    // 生存している人狼の数
    const werewolves = alivePlayers.filter(
      player => player.role.name === "werewolf"
    );
    
    // 生存している村人判定のプレイヤー（村人陣営 + 第三陣営で村人判定）
    const villageSidePlayers = alivePlayers.filter(player => {
      // 人狼陣営でも狂人は村人判定
      if (player.role.name === "werewolf") return false;
      
      // 占い結果が黒の役職は除外
      return player.role.getFortuneResult() === "white";
    });
    
    // 人狼がゼロなら勝利条件は満たさない
    if (werewolves.length === 0) {
      return { satisfied: false };
    }
    
    // 村人陣営が人狼と同数以下なら勝利
    return {
      satisfied: villageSidePlayers.length <= werewolves.length,
      winningTeam: "werewolf",
      reason: "村人陣営の数が人狼陣営と同数以下になった"
    };
  };
}
```

## 11. 実装ガイドライン

### 11.1 勝利条件のテスト容易性

勝利条件の判定ロジックをテストしやすい設計にする重要なポイント：

1. **純粋関数として実装**: 外部状態に依存せず、同じ入力に対して常に同じ出力を返す
2. **モックゲーム状態の活用**: テスト時にゲーム状態をモックして様々なケースを検証
3. **エッジケースの考慮**: 全プレイヤー死亡、特定役職ゼロなど極端なケースも検証
4. **組み合わせテスト**: 複数の勝利条件が同時に満たされるケースのテスト

```javascript
// テスト例
test('村人陣営勝利条件 - 人狼全滅時に満たされる', () => {
  // モックゲーム状態の作成
  const mockGame = {
    getAlivePlayers: () => [
      { id: 1, role: { name: 'villager', team: 'village' } },
      { id: 2, role: { name: 'seer', team: 'village' } }
    ]
  };
  
  // 村人陣営勝利条件
  const condition = villageWinCondition.condition;
  
  // 判定実行
  const result = condition(mockGame);
  
  // 検証
  expect(result.satisfied).toBe(true);
  expect(result.winningTeam).toBe('village');
});
```

### 11.2 パフォーマンス考慮

勝利判定は頻繁に実行される可能性があるため、パフォーマンスを考慮した実装が重要です：

1. **キャッシュの活用**: プレイヤーリストや役職情報のキャッシュ
2. **早期リターン**: 明らかに条件が満たせない場合は早期に判定を終了
3. **計算の最適化**: 複雑な条件判定は必要最小限の計算に留める
4. **検証の順序**: 計算コストの低い条件を先に検証

```javascript
// パフォーマンスを考慮した実装例
checkVictoryConditions() {
  // 既にゲーム結果が確定している場合はキャッシュを返す
  if (this.gameResult) return this.gameResult;
  
  // 生存プレイヤーリストをキャッシュ（複数回参照されるため）
  const alivePlayers = this.game.getAlivePlayers();
  
  // プレイヤーが0人なら即時引き分け判定
  if (alivePlayers.length === 0) {
    return this.setGameResult({
      winningTeam: "draw",
      reason: "全プレイヤーが死亡した",
      conditionId: "all_dead"
    });
  }
  
  // 人狼の数をカウント（複数の条件で使用されるため先に計算）
  const werewolfCount = alivePlayers.filter(p => p.role.name === "werewolf").length;
  
  // 村人陣営勝利条件（人狼が全滅）
  if (werewolfCount === 0) {
    return this.setGameResult({
      winningTeam: "village",
      reason: "人狼が全滅した",
      conditionId: "village_win"
    });
  }
  
  // 人狼陣営勝利条件（計算コストが高いため後に検証）
  // ...
}
```

### 11.3 柔軟な設定

レギュレーションによって勝利条件が変わる場合に対応する設計：

```javascript
// レギュレーションに基づく勝利条件の調整
adjustVictoryConditionsForRegulation() {
  const regulation = this.game.options.regulations;
  
  // 特殊な引き分け条件
  if (regulation.specialDrawCondition) {
    this.registerCustomVictoryCondition({
      id: "special_draw",
      team: "draw",
      displayName: "特殊引き分け",
      description: regulation.specialDrawDescription || "特殊な引き分け条件が満たされた",
      condition: this.createSpecialDrawCondition(regulation),
      priority: 60
    });
  }
  
  // 時間制限による強制終了
  if (regulation.timeLimit) {
    // 時間制限イベントリスナーを設定
    this.game.eventSystem.on('game.time_limit_reached', () => {
      const result = this.handleTimeLimit();
      this.setGameResult(result);
      
      // 時間制限イベント発火
      this.game.eventSystem.emit('victory.time_limit', {
        ...result,
        turn: this.game.phaseManager.getCurrentTurn()
      });
    });
  }
}
```

## 12. まとめ

勝利条件判定システムは、人狼ゲームの進行状況を監視し、各陣営の勝利条件達成を判定する重要なコンポーネントです。本設計書では、村人陣営、人狼陣営、妖狐陣営などの基本的な勝利条件を定義すると共に、将来的な拡張に対応できる柔軟な設計を提供しました。

特に以下の特徴を持つシステムを設計しました：

1. **正確な勝利判定**: 各陣営の勝利条件を明確に定義し、一貫して判定
2. **柔軟な条件表現**: 関数型と宣言型の両方で勝利条件を定義可能
3. **イベント駆動アーキテクチャ**: 他システムとの緊密な連携によるタイミング制御
4. **拡張性の高い設計**: 新しい陣営や勝利条件を容易に追加可能
5. **特殊ケースへの対応**: 全プレイヤー死亡、時間制限など特殊状況への対応

また、勝利条件判定のタイミングや具体的な判定ロジックについても詳細に定義し、テスト容易性やパフォーマンスにも配慮した実装ガイドラインを提供しました。

この設計に基づくことで、多様な人狼ゲームの勝敗判定を適切に処理できるシステムを実装できます。
