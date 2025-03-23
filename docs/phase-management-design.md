# 人狼ゲームGM支援ライブラリ フェーズ管理システム設計書

## 1. 概要

本設計書では人狼ゲームGM支援ライブラリのフェーズ管理システムについて詳細に定義します。フェーズ管理システムはゲームの進行を制御する中核コンポーネントであり、各フェーズの定義、遷移ルール、イベント発火のタイミング、およびフェーズ間の状態管理を担当します。

## 2. 設計目標

- **明確な状態管理**: ゲームの進行状態を明示的に管理
- **柔軟な遷移ルール**: 様々なレギュレーションに対応できる遷移ルール
- **イベント連携**: 各フェーズの開始・終了時に適切なイベントを発火
- **拡張性**: カスタムフェーズの追加や遷移ルールの拡張が可能な設計
- **整合性確保**: 不正な状態遷移を防止する仕組み

## 3. フェーズの定義

人狼ゲームの基本フェーズを以下のように定義します。

### 3.1 基本フェーズ一覧

| フェーズID | 名称 | 説明 |
|-----------|------|-----|
| `preparation` | 準備フェーズ | ゲーム開始前の準備段階 |
| `night` | 夜フェーズ | 夜の役職能力使用タイミング |
| `day` | 昼フェーズ | 議論と情報共有のタイミング |
| `vote` | 投票フェーズ | 処刑対象を決定する投票タイミング |
| `runoffVote` | 決選投票フェーズ | 同数得票時の決選投票タイミング |
| `execution` | 処刑フェーズ | 処刑実行と結果確認のタイミング |
| `gameEnd` | 終了フェーズ | ゲーム終了と勝敗確定のタイミング |

### 3.2 フェーズの属性

各フェーズは以下の属性を持ちます：

```javascript
{
  id: "night",                  // フェーズ一意識別子
  displayName: "夜フェーズ",     // 表示名
  description: "役職能力を使用します", // 説明文
  allowedActions: ["fortune", "guard", "attack"], // 許可されるアクション
  requiredActions: [],          // 必須アクション（実行必須）
  timeLimit: null,              // 時間制限（秒、nullは無制限）
  visibilityPolicy: {           // 情報可視性ポリシー
    showDeadPlayers: true,      // 死亡プレイヤー表示
    showRoles: false,           // 役職表示
    showVotes: false            // 投票表示
  },
  metadata: {}                  // 拡張用メタデータ
}
```

### 3.3 特殊フェーズ

特定条件下で発生する特殊フェーズも定義します：

| フェーズID | 名称 | 説明 |
|-----------|------|-----|
| `firstNight` | 初日夜 | 初日特有のルールが適用される夜フェーズ |
| `firstDay` | 初日昼 | 初日特有のルールが適用される昼フェーズ |
| `finalVote` | 最終投票 | 勝敗を左右する最終投票（特殊判定） |

## 4. フェーズ遷移ルール

### 4.1 基本遷移パターン

標準的なゲームの進行は以下の遷移パターンに従います：

```
preparation → firstNight → firstDay → vote → 
[runoffVote →]* execution → night → day → vote → 
[runoffVote →]* execution → ...
```

ここで、`[runoffVote →]*` は同票の場合に0回以上の決選投票フェーズが発生することを示します。

### 4.2 遷移ルールの定義

フェーズ遷移ルールを以下のように定義します：

```javascript
{
  sourcePhase: "night",         // 遷移元フェーズ
  targetPhase: "day",           // 遷移先フェーズ
  condition: (game) => true,    // 遷移条件（関数）
  priority: 10,                 // 優先度（複数条件が真の場合）
  actions: [                    // 遷移時実行アクション
    "resolveNightActions",      // 夜アクションの解決
    "checkVictoryCondition"     // 勝利条件チェック
  ]
}
```

### 4.3 標準遷移ルール一覧

| 遷移元 | 遷移先 | 条件 | アクション |
|-------|-------|------|----------|
| `preparation` | `firstNight` | ゲーム開始時 | 役職配布、初期化 |
| `firstNight` | `firstDay` | 夜アクション完了時 | 夜アクション処理、死亡判定 |
| `firstDay` | `vote` | 議論終了時 | - |
| `night` | `day` | 夜アクション完了時 | 夜アクション処理、死亡判定 |
| `day` | `vote` | 議論終了時 | - |
| `vote` | `runoffVote` | 同票発生かつ決選投票ルール適用時 | 決選投票対象選出 |
| `vote` | `execution` | 処刑対象決定時 | - |
| `runoffVote` | `execution` | 常に | 決選投票集計 |
| `execution` | `night` | 処刑実行かつゲーム未終了時 | 処刑実行、死亡判定、勝利判定 |
| `execution` | `gameEnd` | 勝利条件達成時 | 勝利陣営決定 |
| `night` | `gameEnd` | 勝利条件達成時 | 勝利陣営決定 |
| `vote` | `gameEnd` | 勝利条件達成時 | 勝利陣営決定 |

### 4.4 特殊ルール対応遷移

| 特殊ルール | 影響する遷移 | 変更内容 |
|-----------|------------|----------|
| 初日処刑なし | `firstDay → night` | 初日に限り投票フェーズをスキップ |
| 役職欠け | なし | （役職構成に影響するが遷移に直接影響なし） |
| 連続ガード不可 | なし | （アクション制約に影響するが遷移に直接影響なし） |
| 同票処理方式 | `vote → runoffVote` | 同票時の処理方法により遷移先変更 |

## 5. フェーズマネージャーの設計

フェーズを管理するコンポーネントの詳細設計です。

### 5.1 主要コンポーネント

- **PhaseManager**: フェーズの定義、遷移、状態管理を担当
- **PhaseDefinition**: 各フェーズの定義を保持
- **TransitionRule**: フェーズ間の遷移ルールを定義
- **PhaseContext**: 現在のフェーズのコンテキスト情報を保持

### 5.2 PhaseManagerのインターフェース

```javascript
class PhaseManager {
  // 現在のフェーズとターン情報
  currentPhase = null;
  currentTurn = 0;
  phaseHistory = [];
  
  // 初期化
  constructor(game, options) {
    this.game = game;
    this.options = options;
    this.phases = new Map(); // フェーズ定義マップ
    this.transitions = [];   // 遷移ルールリスト
    this.initializePhases(); // 標準フェーズ定義
    this.initializeTransitions(); // 標準遷移ルール定義
  }
  
  // 現在のフェーズ取得
  getCurrentPhase() { ... }
  
  // 現在のターン数取得
  getCurrentTurn() { ... }
  
  // 次のフェーズへ進む
  moveToNextPhase() { ... }
  
  // 特定のフェーズへ移動
  moveToPhase(phaseId) { ... }
  
  // フェーズ定義を追加
  registerPhase(phaseDefinition) { ... }
  
  // 遷移ルールを追加
  registerTransition(transitionRule) { ... }
  
  // ターン数を増加
  incrementTurn() { ... }
  
  // フェーズ履歴を取得
  getPhaseHistory() { ... }
}
```

### 5.3 フェーズ遷移の内部処理

フェーズ遷移時の内部処理フローを示します：

```
1. moveToNextPhase/moveToPhaseが呼ばれる
2. 現在のフェーズからの有効な遷移候補を取得
3. 条件を満たす遷移ルールを優先度順に評価
4. 最も優先度の高い遷移ルールを選択
5. 現在のフェーズの終了イベントを発火
   - `phase.end.{currentPhase}`
6. 遷移ルールに定義されたアクションを実行
7. 遷移先フェーズの設定
8. 必要に応じてターン数を増加
9. 新しいフェーズの開始イベントを発火
   - `phase.start.{newPhase}`
10. フェーズ履歴を更新
```

## 6. フェーズと他システムの連携

### 6.1 イベントシステムとの連携

フェーズ管理システムは以下のイベントを発火します：

| イベント | 説明 | データ例 |
|---------|------|----------|
| `phase.start.{phaseId}` | フェーズ開始時 | `{phase: "night", turn: 2}` |
| `phase.end.{phaseId}` | フェーズ終了時 | `{phase: "night", turn: 2, duration: 120}` |
| `turn.start` | 新しいターン開始時 | `{turn: 3, phases: ["night", "day", "vote"]}` |
| `turn.end` | ターン終了時 | `{turn: 3, summary: {...}}` |

フェーズマネージャーは以下のイベントを購読します：

| イベント | 処理内容 |
|---------|----------|
| `action.complete.all` | 全アクション完了時に次フェーズへの移行検討 |
| `vote.result` | 投票結果に基づく次フェーズ決定 |
| `victory.condition` | 勝利条件達成時にゲーム終了フェーズへ移行 |

### 6.2 役職システムとの連携

フェーズと役職能力の連携を定義します：

| フェーズ | 役職連携内容 |
|---------|------------|
| `night` | - 夜行動可能な役職のリストをフェーズコンテキストに設定<br>- 各役職の `canUseAbility(night)` を呼び出し<br>- 役職アクション登録の受付 |
| `day` | - 昼行動可能な役職のリストをフェーズコンテキストに設定<br>- 不在投票など特殊投票の設定 |
| `vote` | - 投票重みなど投票に影響する役職特性の適用 |
| `execution` | - 処刑時の特殊能力（猫又の道連れなど）の発動 |

### 6.3 アクションシステムとの連携

フェーズとアクション処理の連携を定義します：

| フェーズ移行 | アクション処理 |
|------------|--------------|
| `night → day` | 1. 夜アクションの集計<br>2. アクション実行順序の決定<br>3. 優先度順のアクション実行<br>4. アクション結果の適用<br>5. 死亡判定 |
| `vote → execution` | 1. 投票アクションの集計<br>2. 最多得票者の決定<br>3. 処刑対象の設定 |
| `runoffVote → execution` | 1. 決選投票の集計<br>2. 処刑対象の設定（同数の場合はルールに従う） |

## 7. ターン管理

ゲームの進行を日単位で管理するターン管理の設計です。

### 7.1 ターンの定義

1ターンの基本構成は以下の通りです：

```
1ターン = [夜フェーズ → 昼フェーズ → 投票フェーズ → (決選投票) → 処刑フェーズ]
```

特別なケース：
- 初日は `firstNight → firstDay → vote → ...` の特殊シーケンス
- 初日処刑なしの場合は `firstDay → night → ...` と投票をスキップ

### 7.2 ターン管理の実装

```javascript
// ターン管理メソッド例
incrementTurn() {
  const currentTurn = this.currentTurn;
  const nextTurn = currentTurn + 1;
  
  // ターン開始イベント発火
  this.game.eventSystem.emit('turn.start', {
    turn: nextTurn,
    previousTurn: currentTurn
  });
  
  this.currentTurn = nextTurn;
  
  // ターン情報の状態更新
  this.game.updateState({
    turn: nextTurn,
    day: Math.ceil(nextTurn / 2) // 2フェーズ（昼・夜）で1日換算
  });
  
  return nextTurn;
}

// 標準的なターン終了判定
isEndOfTurn() {
  // 処刑フェーズが終わったらターン終了とみなす
  return this.currentPhase.id === 'execution';
}

// ターン終了時処理
endTurn() {
  // ターン終了イベント発火
  this.game.eventSystem.emit('turn.end', {
    turn: this.currentTurn,
    summary: this.generateTurnSummary()
  });
  
  // 必要に応じてターン情報を保存
  this.turnHistory.push(this.generateTurnSummary());
  
  // 勝利条件チェック
  this.game.checkVictoryCondition();
}
```

### 7.3 ターンサマリー

各ターンの終了時にターンの要約を生成します：

```javascript
generateTurnSummary() {
  return {
    turn: this.currentTurn,
    phases: this.getPhasesInCurrentTurn(),
    deaths: this.getDeathsInCurrentTurn(),
    votes: this.getVotesInCurrentTurn(),
    actions: this.getActionsInCurrentTurn(),
    timestamp: Date.now()
  };
}
```

## 8. フェーズ固有の処理

各フェーズ特有の処理を定義します。

### 8.1 夜フェーズ（Night）

```javascript
// 夜フェーズ開始時処理
onNightPhaseStart() {
  const turn = this.currentTurn;
  const isFirstNight = turn === 1;
  
  // 夜アクション対象役職の取得
  const eligibleRoles = this.game.roleManager.getRolesWithNightAction(turn);
  
  // フェーズコンテキスト設定
  this.setPhaseContext({
    eligibleRoles,
    pendingActions: new Set(eligibleRoles.map(r => r.playerId)),
    actionResults: new Map(),
    isFirstNight
  });
  
  // 初日占いなど特殊ルールの適用
  if (isFirstNight) {
    this.applyFirstNightRules();
  }
  
  // 夜フェーズ開始イベント発火
  this.game.eventSystem.emit('phase.start.night', {
    turn,
    isFirstNight,
    eligibleRoles: eligibleRoles.map(r => ({
      playerId: r.playerId,
      role: r.name
    }))
  });
}

// 夜フェーズ終了時処理
onNightPhaseEnd() {
  const context = this.getPhaseContext();
  
  // 未実行アクションの自動処理（タイムアウトなど）
  if (context.pendingActions.size > 0) {
    this.handlePendingNightActions(context.pendingActions);
  }
  
  // 夜アクションの実行
  this.executeNightActions();
  
  // 夜フェーズ終了イベント発火
  this.game.eventSystem.emit('phase.end.night', {
    turn: this.currentTurn,
    actionResults: this.summarizeActionResults(),
    deaths: this.getNewDeaths()
  });
}

// 夜アクションの実行処理
executeNightActions() {
  // アクションマネージャーからアクション取得
  const actions = this.game.actionManager.getRegisteredActions('night', this.currentTurn);
  
  // 優先度でソート
  const sortedActions = this.sortActionsByPriority(actions);
  
  // アクション実行
  for (const action of sortedActions) {
    this.executeAction(action);
  }
  
  // 死亡判定と処理
  this.resolveDeath();
}
```

### 8.2 投票フェーズ（Vote）

```javascript
// 投票フェーズ開始時処理
onVotePhaseStart() {
  // 投票対象者リスト（生存者）
  const targets = this.game.getAlivePlayers();
  
  // 投票者リスト（生存者）
  const voters = this.game.getAlivePlayers();
  
  // フェーズコンテキスト設定
  this.setPhaseContext({
    targets: targets.map(p => p.id),
    voters: voters.map(p => p.id),
    votes: new Map(),
    complete: false
  });
  
  // 投票開始イベント発火
  this.game.eventSystem.emit('vote.start', {
    turn: this.currentTurn,
    targets: targets.map(p => ({
      id: p.id,
      name: p.name
    })),
    voters: voters.map(p => ({
      id: p.id,
      name: p.name
    })),
    isRunoff: false
  });
}

// 投票フェーズ終了時処理
onVotePhaseEnd() {
  const context = this.getPhaseContext();
  
  // 未投票者の自動処理（棄権など）
  this.handleRemainingVoters(context);
  
  // 投票集計
  const result = this.game.voteManager.countVotes(context.votes);
  
  // 同数判定と次フェーズ決定
  const needsRunoff = this.checkRunoffNeeded(result);
  
  // コンテキスト更新
  context.result = result;
  context.needsRunoff = needsRunoff;
  
  // 投票結果イベント発火
  this.game.eventSystem.emit('vote.result', {
    turn: this.currentTurn,
    votes: [...context.votes].map(([voterId, targetId]) => ({
      voter: voterId,
      target: targetId
    })),
    counts: result.counts,
    maxVoted: result.maxVoted,
    isTie: result.isTie,
    needsRunoff
  });
}
```

### 8.3 決選投票フェーズ（RunoffVote）

```javascript
// 決選投票フェーズ開始時処理
onRunoffVotePhaseStart() {
  // 前フェーズの投票結果を取得
  const previousResult = this.getPreviousPhaseContext().result;
  
  // 決選投票対象者（最多得票者）
  const targets = previousResult.maxVoted;
  
  // 投票者リスト（生存者）
  const voters = this.game.getAlivePlayers().map(p => p.id);
  
  // フェーズコンテキスト設定
  this.setPhaseContext({
    targets,
    voters,
    votes: new Map(),
    complete: false,
    previousResult
  });
  
  // 決選投票開始イベント発火
  this.game.eventSystem.emit('vote.runoff.start', {
    turn: this.currentTurn,
    targets: targets.map(targetId => {
      const player = this.game.getPlayer(targetId);
      return {
        id: targetId,
        name: player.name
      };
    }),
    voters: voters.map(voterId => {
      const player = this.game.getPlayer(voterId);
      return {
        id: voterId,
        name: player.name
      };
    })
  });
}

// 決選投票フェーズ終了時処理
onRunoffVotePhaseEnd() {
  const context = this.getPhaseContext();
  
  // 未投票者の自動処理
  this.handleRemainingVoters(context);
  
  // 決選投票集計
  const result = this.game.voteManager.countVotes(context.votes);
  
  // 最終的な処刑対象決定（同数の場合はルールに基づく）
  const executionTarget = this.determineExecutionTarget(result);
  
  // コンテキスト更新
  context.result = result;
  context.executionTarget = executionTarget;
  
  // 決選投票結果イベント発火
  this.game.eventSystem.emit('vote.runoff.result', {
    turn: this.currentTurn,
    votes: [...context.votes].map(([voterId, targetId]) => ({
      voter: voterId,
      target: targetId
    })),
    counts: result.counts,
    maxVoted: result.maxVoted,
    isTie: result.isTie,
    executionTarget
  });
}

// 処刑対象の最終決定
determineExecutionTarget(result) {
  // 同票なしの場合は最多得票者
  if (!result.isTie) {
    return result.maxVoted[0];
  }
  
  // 同票時のルールに基づく処理
  const tieRule = this.game.options.regulations.runoffTieRule;
  
  switch (tieRule) {
    case 'random':
      // ランダム選出
      return this.selectRandomTarget(result.maxVoted);
    
    case 'no_execution':
      // 処刑なし
      return null;
    
    case 'all_execution':
      // 全員処刑（特殊フラグ）
      return 'all';
    
    default:
      return null;
  }
}
```

### 8.4 処刑フェーズ（Execution）

```javascript
// 処刑フェーズ開始時処理
onExecutionPhaseStart() {
  // 前フェーズの結果から処刑対象を取得
  let executionTarget;
  
  if (this.previousPhase.id === 'runoffVote') {
    executionTarget = this.getPreviousPhaseContext().executionTarget;
  } else {
    // 通常投票の結果から取得
    const voteResult = this.getPreviousPhaseContext().result;
    executionTarget = voteResult.isTie ? null : voteResult.maxVoted[0];
  }
  
  // フェーズコンテキスト設定
  this.setPhaseContext({
    executionTarget,
    executed: false,
    specialEffects: []
  });
  
  // 処刑開始イベント発火
  this.game.eventSystem.emit('execution.start', {
    turn: this.currentTurn,
    target: executionTarget ? this.getPlayerInfo(executionTarget) : null
  });
}

// 処刑フェーズ終了時処理
onExecutionPhaseEnd() {
  const context = this.getPhaseContext();
  
  // 処刑実行
  if (context.executionTarget) {
    // 単一対象の処刑
    if (context.executionTarget !== 'all') {
      this.executePlayer(context.executionTarget, 'execution');
    } 
    // 全員処刑（特殊ルール）
    else {
      this.executeAllTargets();
    }
  }
  
  // 処刑結果イベント発火
  this.game.eventSystem.emit('execution.result', {
    turn: this.currentTurn,
    target: context.executionTarget ? this.getPlayerInfo(context.executionTarget) : null,
    executed: context.executed,
    specialEffects: context.specialEffects
  });
  
  // 勝利条件チェック
  this.game.checkVictoryCondition();
}

// プレイヤー処刑処理
executePlayer(playerId, cause = 'execution') {
  const player = this.game.getPlayer(playerId);
  if (!player || !player.isAlive) return false;
  
  // 処刑前イベント発火（猫又などの特殊効果のため）
  this.game.eventSystem.emit('execution.before', {
    playerId,
    player: this.getPlayerInfo(playerId)
  });
  
  // プレイヤーを死亡状態に
  player.isAlive = false;
  player.causeOfDeath = cause;
  player.deathTurn = this.currentTurn;
  
  // 処刑後イベント発火
  this.game.eventSystem.emit('player.death', {
    playerId,
    player: this.getPlayerInfo(playerId),
    cause,
    turn: this.currentTurn
  });
  
  // 役職公開設定
  if (this.game.options.regulations.revealRoleOnDeath) {
    this.game.eventSystem.emit('player.roleReveal', {
      playerId,
      role: player.role.name,
      cause: 'death'
    });
  }
  
  return true;
}
```

## 9. カスタムフェーズと拡張性

### 9.1 カスタムフェーズの登録

```javascript
// カスタムフェーズの登録例
phaseManager.registerPhase({
  id: "customPhase",
  displayName: "カスタムフェーズ",
  description: "拡張ルール用のカスタムフェーズ",
  allowedActions: ["customAction"],
  onPhaseStart: (manager, game) => {
    // カスタム処理
    game.eventSystem.emit('phase.start.customPhase', {
      turn: manager.getCurrentTurn()
    });
  },
  onPhaseEnd: (manager, game) => {
    // カスタム処理
    game.eventSystem.emit('phase.end.customPhase', {
      turn: manager.getCurrentTurn()
    });
  }
});
```

### 9.2 カスタム遷移ルールの登録

```javascript
// カスタム遷移ルールの登録例
phaseManager.registerTransition({
  sourcePhase: "day",
  targetPhase: "customPhase",
  condition: (game) => game.hasEnabledRule('customRule'),
  priority: 20, // 標準遷移より優先
  actions: ["customAction"]
});

phaseManager.registerTransition({
  sourcePhase: "customPhase",
  targetPhase: "vote",
  condition: (game) => true,
  priority: 10,
  actions: []
});
```

### 9.3 フェーズプラグインの仕組み

```javascript
// フェーズプラグインの登録例
werewolf.registerPhasePlugin('specialNight', {
  // フェーズ定義
  phases: [{
    id: "specialNight",
    displayName: "特殊な夜",
    // ...フェーズ定義
  }],
  
  // 遷移ルール
  transitions: [{
    sourcePhase: "day",
    targetPhase: "specialNight",
    condition: (game) => game.currentTurn % 3 === 0, // 3の倍数のターンで発生
    priority: 15
  }, {
    sourcePhase: "specialNight",
    targetPhase: "night",
    condition: (game) => true,
    priority: 10
  }],
  
  // 初期化処理
  initialize: (game) => {
    // プラグイン初期化処理
    game.eventSystem.on('phase.start.specialNight', (event) => {
      // 特殊な夜の処理
    });
  }
});

// プラグイン有効化
game.enablePhasePlugin('specialNight');
```

## 10. フェーズコンテキスト管理

フェーズごとの状態や情報を管理するフェーズコンテキストの設計です。

### 10.1 フェーズコンテキストの構造

```javascript
{
  phaseId: "night",         // フェーズID
  startTime: 1621234567890, // 開始時刻
  endTime: null,            // 終了時刻（進行中はnull）
  turn: 2,                  // ターン数
  status: "in_progress",    // 状態（準備中/進行中/完了）
  data: {                   // フェーズ固有データ
    // 夜フェーズの場合
    eligibleRoles: [playerId1, playerId2],
    pendingActions: Set(playerId1, playerId2),
    actionResults: Map()
    // 投票フェーズの場合
    // voters: [playerId1, playerId2, ...],
    // targets: [playerId1, playerId2, ...],
    // votes: Map(voterId => targetId)
  }
}
```

### 10.2 コンテキスト管理メソッド

```javascript
// フェーズコンテキスト設定
setPhaseContext(data) {
  this.currentContext = {
    phaseId: this.currentPhase.id,
    startTime: Date.now(),
    endTime: null,
    turn: this.currentTurn,
    status: 'in_progress',
    data: data || {}
  };
  
  return this.currentContext;
}

// 現在のフェーズコンテキスト取得
getPhaseContext() {
  return this.currentContext;
}

// コンテキストデータ更新
updatePhaseContextData(partialData) {
  if (!this.currentContext) return null;
  
  this.currentContext.data = {
    ...this.currentContext.data,
    ...partialData
  };
  
  return this.currentContext;
}

// フェーズ終了時のコンテキスト更新
finalizePhaseContext() {
  if (!this.currentContext) return null;
  
  this.currentContext.endTime = Date.now();
  this.currentContext.status = 'completed';
  
  // 履歴に追加
  this.phaseHistory.push({...this.currentContext});
  
  return this.currentContext;
}

// 前フェーズのコンテキスト取得
getPreviousPhaseContext() {
  if (this.phaseHistory.length === 0) return null;
  return this.phaseHistory[this.phaseHistory.length - 1];
}
```

## 11. 実装例と使用パターン

### 11.1 標準的なゲーム進行例

```javascript
// ゲーム作成
const game = werewolf.createGame({
  options: {
    // ...ゲーム設定
    regulations: {
      firstDayExecution: false, // 初日処刑なし
      runoffTieRule: 'random'   // 決選投票同数ならランダム
    }
  }
});

// プレイヤー追加
game.addPlayer("プレイヤー1");
// ...他のプレイヤー追加

// 役職設定
game.setRoles(['villager', 'werewolf', 'seer', ...]);

// ゲーム開始（準備フェーズから開始）
game.start();

// 次のフェーズに進む（準備 → 初日夜）
game.phaseManager.moveToNextPhase();

// 夜アクション登録（UI操作の結果）
game.registerAction({
  type: 'fortune',      // 占い
  actor: 2,             // 占い師プレイヤーID
  target: 1,            // 対象プレイヤーID
  night: 1              // 夜のターン
});

// すべてのアクションが登録されたら次のフェーズへ
game.phaseManager.moveToNextPhase(); // 初日夜 → 初日昼

// 昼のフェーズ終了（議論終了）
game.phaseManager.moveToNextPhase(); // 初日昼 → 投票

// 投票登録（UI操作の結果）
game.vote(0, 3);  // プレイヤー0がプレイヤー3に投票
// ...他の投票

// すべての投票が完了したら次のフェーズへ
game.phaseManager.moveToNextPhase(); // 投票 → 処刑/決選投票

// 処刑実行
game.phaseManager.moveToNextPhase(); // 処刑 → 夜

// 以降同様にサイクル
```

### 11.2 カスタムレギュレーション例

```javascript
// 特殊フェーズのあるゲーム設定
const game = werewolf.createGame({
  options: {
    // ...標準設定
    customPhases: true // カスタムフェーズを有効化
  }
});

// カスタムフェーズプラグイン有効化
game.enablePhasePlugin('specialNight');

// イベントリスナー登録
game.on('phase.start.specialNight', (event) => {
  console.log('特殊な夜が始まりました', event);
  
  // UI側で特殊な処理を行う
  // ...
});

// ゲーム進行
game.start();
// ...通常の進行

// 3ターン目に特殊な夜が自動的に挿入される
// day → specialNight → night → ...
```

## 12. まとめ

フェーズ管理システムはゲーム進行の中核として、プレイヤー、役職、アクション、投票など他のすべてのシステムと連携して動作します。各フェーズでの処理と遷移ルールを明確に定義することで、様々なレギュレーションに柔軟に対応でき、カスタムルールの追加も容易になります。

イベント駆動型のデザインにより、UIやクライアントとの連携も容易であり、GM支援ツールに必要な情報を適切なタイミングで提供することができます。また、フェーズ履歴の記録により、ゲームの再現や分析も可能になります。
