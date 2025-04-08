# 人狼ゲームGM支援ライブラリ - モジュール結合ガイド

## 1. 結合の基本原則

### 1.1 依存関係の方向性を明確に保つ

設計書に示されている依存関係の方向を厳守することが重要です。

```
Core (EventSystem, ErrorSystem, Common/Utils)
  ↑
Domain Models (Player, Role, Phase, etc.)
  ↑
Service Layer (各Manager)
  ↑
GameManager
```

この階層構造を維持することで、下位レイヤーが上位レイヤーに依存する循環参照を防げます。各レイヤーの責務を明確に分離し、単一方向の依存関係を確立することが、長期的なメンテナンス性の鍵となります。

### 1.2 インターフェースを介した結合

モジュール間の結合は、具体的な実装ではなくインターフェース（APIの定義）を介して行うことで、内部実装の変更に強い設計になります。これにより、各モジュールは独立して進化・改善できます。

```javascript
// インターフェース定義例
class PlayerManagerInterface {
  addPlayer(name) {}
  removePlayer(id) {}
  getPlayer(id) {}
  getAlivePlayers() {}
}

// 実装クラス
class PlayerManager extends PlayerManagerInterface {
  // 実装...
}
```

### 1.3 段階的な結合アプローチ

一度にすべてのモジュールを結合するのではなく、以下のように段階的に進めることをお勧めします：

1. コアモジュール間の結合
2. ドメインモデル間の結合
3. ドメインモデルとマネージャーの結合
4. 全体統合

各段階で十分なテストを行い、問題を早期に発見・修正することが重要です。

## 2. 具体的な結合アプローチ

### 2.1 依存性注入パターンの活用

マネージャークラスやモデルクラスのコンストラクタで依存するモジュールを注入する方式を採用することで、テストが容易になり、柔軟な構成が可能になります。

```javascript
// 依存性注入の例
class PhaseManager {
  constructor(eventSystem, errorHandler, playerManager) {
    this.eventSystem = eventSystem;
    this.errorHandler = errorHandler;
    this.playerManager = playerManager;
    // 初期化処理
  }
  
  // メソッド実装...
}

// テスト時にはモックを注入可能
const mockEventSystem = { /* モック実装 */ };
const mockErrorHandler = { /* モック実装 */ };
const mockPlayerManager = { /* モック実装 */ };
const phaseManager = new PhaseManager(mockEventSystem, mockErrorHandler, mockPlayerManager);
```

### 2.2 ファサードパターンによる結合

GameManagerクラスをファサードとして設計し、内部的には各マネージャーを保持して委譲する形にすることで、クライアントからは単一のインターフェースでアクセスできます。

```javascript
class GameManager {
  constructor(options = {}) {
    // オプションからの設定取得
    const { regulations = {}, randomSeed } = options;
    
    // 各コアシステムの初期化
    this.eventSystem = new EventSystem();
    this.errorHandler = new ErrorHandler(this.eventSystem);
    
    // 共通ユーティリティの初期化
    this.random = randomSeed ? new SeededRandom(randomSeed) : new Random();
    
    // 各マネージャーの初期化（依存性注入）
    this.playerManager = new PlayerManager(this.eventSystem, this.errorHandler);
    this.roleManager = new RoleManager(this.eventSystem, this.errorHandler, this.random);
    this.phaseManager = new PhaseManager(this.eventSystem, this.errorHandler, this.playerManager);
    this.voteManager = new VoteManager(this.eventSystem, this.errorHandler, this.playerManager);
    this.actionManager = new ActionManager(this.eventSystem, this.errorHandler, this.playerManager, this.roleManager);
    this.victoryManager = new VictoryManager(this.eventSystem, this.errorHandler, this.playerManager, this.roleManager);
    
    // レギュレーション設定
    this.setRegulations(regulations);
    
    // 相互参照の設定（必要な場合）
    this.setupCrossReferences();
    
    // 初期状態の設定
    this.state = {
      phase: null,
      turn: 0,
      isStarted: false,
      isEnded: false
    };
  }
  
  // 相互参照の設定
  setupCrossReferences() {
    // 例: PhaseManagerがVoteManagerを参照する必要がある場合
    this.phaseManager.setVoteManager(this.voteManager);
    this.phaseManager.setActionManager(this.actionManager);
    
    // 勝利判定に必要な参照を設定
    this.victoryManager.setPhaseManager(this.phaseManager);
  }
  
  // 公開API
  addPlayer(name) {
    return this.playerManager.addPlayer(name);
  }
  
  // その他の公開API...
  
  // プライベートメソッド
  #validateGameState(operation) {
    // 操作の妥当性検証...
  }
}
```

### 2.3 イベント駆動型結合

マネージャー間の直接的な結合を減らすため、イベント駆動型のアプローチを活用します。各マネージャーは自身の責務に関連するイベントをリッスンし、適切なタイミングで処理を実行します。

```javascript
// PhaseManager初期化時のイベントリスナー設定例
initializeEventListeners() {
  // 投票結果がまとまったら次のフェーズへ
  this.eventSystem.on('vote.result', (data) => {
    if (data.isFinal) {
      // 状態変更をトランザクション的に実行
      try {
        this.beginStateChange();
        this.moveToNextPhase();
        this.commitStateChange();
      } catch (error) {
        this.rollbackStateChange();
        this.errorHandler.handleError(error);
      }
    }
  });
  
  // プレイヤー死亡時に勝利条件をチェック
  this.eventSystem.on('player.death', (data) => {
    // プレイヤー死亡原因と役職情報をログ
    this.logger.debug(`Player ${data.playerId} died due to ${data.cause}`);
    
    // 勝利条件チェック
    this.game.checkWinCondition();
  });
  
  // パフォーマンス考慮: 不要になったリスナーを適切に削除
  this.eventSystem.on('game.end', () => {
    this.cleanupEventListeners();
  });
}

// パフォーマンス最適化: ハイボリュームイベントの処理
handleHighVolumeEvents() {
  // デバウンス処理による最適化
  this.voteChangeHandler = debounce((voteData) => {
    this.processVoteChanges(voteData);
  }, 50);
  
  this.eventSystem.on('vote.change', this.voteChangeHandler);
}
```

### 2.4 状態管理と一貫性の確保

複数モジュールにまたがる状態変更を一貫して扱うための方法：

```javascript
class StateManager {
  constructor() {
    this.transactionInProgress = false;
    this.snapshot = null;
    this.changeLog = [];
  }
  
  beginTransaction() {
    if (this.transactionInProgress) {
      throw new Error('Transaction already in progress');
    }
    
    this.transactionInProgress = true;
    this.snapshot = this.createStateSnapshot();
    this.changeLog = [];
  }
  
  recordChange(type, targetId, data) {
    if (!this.transactionInProgress) {
      // トランザクション外でも動作可能だが警告を出す
      console.warn('State change outside transaction');
    }
    
    this.changeLog.push({ type, targetId, data, timestamp: Date.now() });
  }
  
  commitTransaction() {
    if (!this.transactionInProgress) {
      throw new Error('No transaction to commit');
    }
    
    // コミット成功イベント発火
    this.eventSystem.emit('state.transaction.commit', {
      changes: this.changeLog,
      duration: Date.now() - this.changeLog[0]?.timestamp
    });
    
    this.transactionInProgress = false;
    this.snapshot = null;
    this.changeLog = [];
  }
  
  rollbackTransaction() {
    if (!this.transactionInProgress) {
      throw new Error('No transaction to rollback');
    }
    
    // スナップショットから状態を復元
    this.restoreStateSnapshot(this.snapshot);
    
    // ロールバックイベント発火
    this.eventSystem.emit('state.transaction.rollback', {
      changes: this.changeLog
    });
    
    this.transactionInProgress = false;
    this.snapshot = null;
    this.changeLog = [];
  }
}
```

## 3. 具体的なモジュール結合ロードマップ

### 3.1 フェーズ1: コアモジュール確認と整備

現在ある程度実装されているコアモジュールの連携を確認し、必要に応じて調整します：

1. EventSystemの機能検証と拡張
   - イベント階層構造のテスト
   - イベント伝播の確認
   - パフォーマンス測定と最適化

2. ErrorSystemとEventSystemの連携確認
   - エラー発生時のイベント発火テスト
   - エラーレベルに応じた処理の検証

3. Common/Utilsの充実と他コアモジュールでの活用
   - 共通ユーティリティの拡充
   - 乱数生成器の検証（特にシード指定時）

**実装優先順位**:
1. EventSystem検証（最優先・基盤となるため）
2. ErrorSystem連携確認
3. Common/Utils機能拡張

### 3.2 フェーズ2: ドメインモデルの結合

ドメインモデル間の基本的な関係を構築します：

1. PlayerモデルとRoleモデルの連携（プレイヤーへの役職割り当て）
   - 役職割り当てインターフェースの設計
   - 役職情報取得メソッドの実装

2. PhaseモデルとEventSystemの連携（フェーズ変更時のイベント発火）
   - フェーズ遷移イベントの定義と実装
   - フェーズコンテキスト情報の設計

3. 各モデルでのErrorSystemの活用（バリデーションと例外処理）
   - 入力検証共通化
   - エラーケースのテスト強化

**実装順序**:
1. まずPlayerModelの単体実装とテスト
2. 次にRoleModelの単体実装とテスト
3. PlayerModelとRoleModel間の連携実装とテスト
4. PhaseModelの実装とイベント連携

### 3.3 フェーズ3: マネージャークラスの結合

各ドメインの管理クラスを結合します：

1. PlayerManagerとRoleManagerの連携（役職割り当てなど）
   - 役職配布ロジックの実装
   - 役職情報アクセス制御

2. PhaseManagerと他マネージャーの連携（フェーズに基づく処理）
   - フェーズ遷移のトリガー設定
   - フェーズごとの振る舞い実装

3. VoteManagerとPlayerManagerの連携（投票処理）
   - 投票者・対象の検証
   - 投票結果の処理

4. ActionManagerとRoleManagerの連携（役職アクション処理）
   - アクション実行可否の判定
   - アクション結果の処理と伝播

**クリティカルパス**:
- PlayerManager → RoleManager → PhaseManager
- 上記3つのマネージャーが正常に連携できれば、他の結合も容易になる

### 3.4 フェーズ4: GameManagerによる統合

最後に全体を統合します：

1. GameManagerの実装
   - 依存性の適切な注入
   - API設計と実装
   - イベントリスナー設定

2. 公開APIの設計と実装
   - 一貫したインターフェース設計
   - バージョニング戦略の確立
   - 破壊的変更の最小化

3. 全体テスト
   - 統合テストの実行
   - シナリオベースのテスト
   - パフォーマンステスト

**実装ステップ**:
1. シンプルなGameManager初期実装（最小機能セット）
2. 段階的に機能を追加（プレイヤー管理→役職管理→フェーズ管理）
3. 各段階でのテスト

## 4. 結合テストの戦略

モジュール結合にあたって、以下のテスト戦略が効果的です：

### 4.1 ペアワイズ統合テスト

まず2つのモジュール間の連携テストを行い、その後徐々に範囲を広げます：

1. EventSystem + ErrorSystem
2. PlayerModel + RoleModel
3. PlayerManager + RoleManager
4. PhaseManager + (PlayerManager + RoleManager)

```javascript
// ペアワイズテスト例: PlayerManagerとRoleManagerの連携
describe('PlayerManager and RoleManager integration', () => {
  let eventSystem, errorHandler, playerManager, roleManager;
  
  beforeEach(() => {
    eventSystem = new EventSystem();
    errorHandler = new ErrorHandler(eventSystem);
    playerManager = new PlayerManager(eventSystem, errorHandler);
    roleManager = new RoleManager(eventSystem, errorHandler);
    
    // テスト用プレイヤー追加
    playerManager.addPlayer('Player1');
    playerManager.addPlayer('Player2');
    
    // テスト用役職の登録
    roleManager.registerRole('villager');
    roleManager.registerRole('werewolf');
  });
  
  test('should assign role to player', () => {
    // テスト実装
    const playerId = 0; // 最初のプレイヤー
    roleManager.assignRole(playerId, 'villager');
    
    const player = playerManager.getPlayer(playerId);
    expect(player.role).toBe('villager');
    
    // 役職情報のテスト
    const roleInfo = roleManager.getRoleInfo(playerId);
    expect(roleInfo.name).toBe('villager');
    expect(roleInfo.team).toBe('village');
  });
});
```

### 4.2 機能シナリオテスト

特定の機能シナリオに焦点を当てたテスト：

1. プレイヤー追加と役職割り当てのシナリオ
2. 夜アクション実行のシナリオ
3. 投票と処刑のシナリオ
4. 勝利条件判定のシナリオ

```javascript
// 機能シナリオテスト例: 投票と処刑プロセス
describe('Voting and Execution Scenario', () => {
  let game;
  
  beforeEach(() => {
    game = new GameManager();
    
    // プレイヤー追加
    for (let i = 0; i < 5; i++) {
      game.addPlayer(`Player${i}`);
    }
    
    // 役職設定（テスト用簡易配置）
    game.setRoles(['villager', 'villager', 'villager', 'werewolf', 'seer']);
    game.distributeRoles();
    
    // ゲーム開始
    game.start();
    
    // 投票フェーズへの移行
    while (game.getCurrentPhase().id !== 'vote') {
      game.nextPhase();
    }
  });
  
  test('should execute player with most votes', () => {
    // 投票の実行
    game.vote(0, 3); // Player0がPlayer3に投票
    game.vote(1, 3); // Player1がPlayer3に投票
    game.vote(2, 0); // Player2がPlayer0に投票
    game.vote(3, 0); // Player3がPlayer0に投票
    game.vote(4, 3); // Player4がPlayer3に投票
    
    // 投票結果の集計と処刑の実行
    game.executeVote();
    
    // 検証: Player3が処刑されたか
    const player3 = game.getPlayer(3);
    expect(player3.isAlive).toBe(false);
    expect(player3.causeOfDeath).toBe('execution');
  });
});
```

### 4.3 エンドツーエンドテスト

全体の流れを確認するテスト：

1. ゲーム開始から終了までの簡易シナリオ
2. 複数ターンを含むより複雑なシナリオ

```javascript
// E2Eテスト例: 簡易ゲームの一連の流れ
describe('Simple game end-to-end flow', () => {
  let game;
  
  beforeEach(() => {
    game = new GameManager({
      regulations: {
        firstDayExecution: false // 初日処刑なし設定
      }
    });
    
    // プレイヤー追加（5人の簡易ゲーム）
    for (let i = 0; i < 5; i++) {
      game.addPlayer(`Player${i}`);
    }
    
    // 役職設定: 村3, 狼1, 占い1
    game.setRoles(['villager', 'villager', 'villager', 'werewolf', 'seer']);
    game.distributeRoles();
  });
  
  test('should complete a game cycle with villagers win', () => {
    // イベントモニタリング
    const events = [];
    game.on('*', (event, data) => {
      events.push({ event, data });
    });
    
    // ゲーム開始
    game.start();
    
    // 1日目夜: 占い師がPlayer3(狼)を占う
    const seerPlayer = findPlayerByRole(game, 'seer');
    const werewolfPlayer = findPlayerByRole(game, 'werewolf');
    
    // 占いアクション
    game.registerAction({
      type: 'fortune',
      actor: seerPlayer.id,
      target: werewolfPlayer.id
    });
    
    // 狼の襲撃
    game.registerAction({
      type: 'attack',
      actor: werewolfPlayer.id,
      target: findPlayerByRole(game, 'villager', 0).id // 最初の村人
    });
    
    // 日中フェーズへ
    game.nextPhase(); // 夜→日中
    
    // 最終的に狼を処刑するシナリオを構築
    // ...フェーズを進める処理...
    
    // 村人勝利の検証
    expect(game.isGameEnded()).toBe(true);
    expect(game.getWinner()).toBe('village');
  });
});

// ヘルパー関数
function findPlayerByRole(game, roleName, index = 0) {
  const players = game.getAllPlayers();
  return players.filter(p => p.role.name === roleName)[index];
}
```

### 4.4 デバッグとトレース戦略

結合時の問題発見に役立つデバッグ戦略:

```javascript
// デバッグ支援機能
class DebugTracer {
  constructor(game) {
    this.game = game;
    this.eventLog = [];
    this.stateChanges = [];
    this.enabled = false;
  }
  
  enable() {
    this.enabled = true;
    this.setupListeners();
  }
  
  disable() {
    this.enabled = false;
    this.teardownListeners();
  }
  
  setupListeners() {
    // イベントの監視
    this.eventListener = (eventName, data) => {
      this.eventLog.push({
        timestamp: Date.now(),
        event: eventName,
        data: JSON.parse(JSON.stringify(data)) // ディープコピー
      });
    };
    
    this.game.eventSystem.on('*', this.eventListener);
    
    // 状態変更の監視
    this.stateListener = (changeData) => {
      this.stateChanges.push({
        timestamp: Date.now(),
        ...changeData
      });
    };
    
    this.game.eventSystem.on('state.change', this.stateListener);
  }
  
  teardownListeners() {
    this.game.eventSystem.off('*', this.eventListener);
    this.game.eventSystem.off('state.change', this.stateListener);
  }
  
  // イベントシーケンスの取得
  getEventSequence() {
    return this.eventLog.map(entry => ({
      time: new Date(entry.timestamp).toISOString(),
      event: entry.event,
      data: entry.data
    }));
  }
  
  // モジュール間の相互作用分析
  getModuleInteractions() {
    const interactions = {};
    
    this.eventLog.forEach(entry => {
      const [module, action] = entry.event.split('.');
      
      if (!interactions[module]) {
        interactions[module] = { emitted: 0, received: 0, actions: {} };
      }
      
      interactions[module].emitted++;
      
      if (!interactions[module].actions[action]) {
        interactions[module].actions[action] = 0;
      }
      
      interactions[module].actions[action]++;
      
      // 受信側の記録
      Object.keys(this.game).forEach(key => {
        if (key.endsWith('Manager') && this.game[key].listensTo?.(entry.event)) {
          const receiverModule = key;
          
          if (!interactions[receiverModule]) {
            interactions[receiverModule] = { emitted: 0, received: 0, actions: {} };
          }
          
          interactions[receiverModule].received++;
        }
      });
    });
    
    return interactions;
  }
  
  // ログのクリア
  clear() {
    this.eventLog = [];
    this.stateChanges = [];
  }
  
  // ログの出力
  exportLogs(format = 'json') {
    switch(format) {
      case 'json':
        return JSON.stringify({
          events: this.eventLog,
          stateChanges: this.stateChanges
        }, null, 2);
      case 'csv':
        // CSV形式でのエクスポート
        return this.formatAsCSV();
      default:
        return this.eventLog;
    }
  }
}

// 使用例
const game = new GameManager();
const debugger = new DebugTracer(game);
debugger.enable();

// ...ゲーム処理...

// トラブルシューティング
console.log(debugger.getEventSequence());
console.log(debugger.getModuleInteractions());
```

## 5. モジュール結合における注意点

### 5.1 循環参照の回避

モジュール間で循環参照が発生しないよう注意します。特に：

- マネージャー間の相互参照を最小限に抑える
- 必要な場合はイベントを介した間接的な通信を検討
- インターフェース（抽象）を介した参照に限定する

```javascript
// 循環参照の代わりにイベントを使う例
// 代わりにVoteManagerが直接PhaseManagerを呼び出す代わりに
this.eventSystem.emit('vote.complete', {
  result: voteResult,
  needsNextPhase: true
});

// PhaseManagerは結果を受け取って処理
this.eventSystem.on('vote.complete', (data) => {
  if (data.needsNextPhase) {
    this.moveToNextPhase();
  }
});
```

循環参照を検出するためのツールや依存関係の可視化も検討しましょう：

```javascript
// 依存関係の可視化ヘルパー
function generateDependencyGraph(game) {
  const modules = {};
  
  // コア依存関係の登録
  Object.keys(game).forEach(key => {
    if (key.endsWith('System') || key.endsWith('Manager')) {
      modules[key] = [];
      
      // 依存関係の解析
      const dependencies = Object.keys(game[key]).filter(prop => 
        game[key][prop] && 
        typeof game[key][prop] === 'object' &&
        (prop.endsWith('System') || prop.endsWith('Manager'))
      );
      
      modules[key] = dependencies;
    }
  });
  
  return modules;
}

// 循環参照の検出
function detectCircularDependencies(depGraph) {
  const visited = {};
  const recursionStack = {};
  const cycles = [];
  
  function dfs(node, path = []) {
    if (recursionStack[node]) {
      // 循環検出
      const cycle = [...path, node];
      cycles.push(cycle);
      return true;
    }
    
    if (visited[node]) return false;
    
    visited[node] = true;
    recursionStack[node] = true;
    
    const dependencies = depGraph[node] || [];
    for (const dep of dependencies) {
      if (dfs(dep, [...path, node])) {
        return true;
      }
    }
    
    recursionStack[node] = false;
    return false;
  }
  
  Object.keys(depGraph).forEach(node => {
    if (!visited[node]) {
      dfs(node);
    }
  });
  
  return cycles;
}
```

### 5.2 状態の一貫性確保

複数のモジュールが共有する状態の一貫性を保つ仕組みが必要です：

- 状態変更はイベントを介して通知
- トランザクション的な処理の実装
- 複数モジュールにまたがる状態変更の原子性確保

イミュータブルなアプローチを考慮することで、状態の追跡が容易になります：

```javascript
// イミュータブルな状態更新
function updateGameState(currentState, changes) {
  // 新しいオブジェクトを作成（シャローコピー）
  const newState = { ...currentState };
  
  // ネストされたオブジェクトも新しいコピーに
  if (changes.players) {
    newState.players = currentState.players.map(player => {
      const playerChanges = changes.players.find(p => p.id === player.id);
      return playerChanges ? { ...player, ...playerChanges } : player;
    });
  }
  
  // その他の変更を適用
  Object.keys(changes).forEach(key => {
    if (key !== 'players') {
      newState[key] = changes[key];
    }
  });
  
  // 変更イベント発火
  this.eventSystem.emit('state.change', {
    previousState: currentState,
    newState,
    changes
  });
  
  return newState;
}
```

### 5.3 エラー伝播の管理

エラーが適切に伝播されるよう設計することが重要です：

- 下位モジュールで発生したエラーの上位への伝播方法
- エラー発生時の状態復旧メカニズム
- エラー発生時のイベント発火と通知

非同期処理とイベント駆動設計におけるエラー処理例：

```javascript
// 非同期処理におけるエラーハンドリング
async executeAction(action) {
  try {
    // アクション実行前イベント
    this.eventSystem.emit('action.before', { action });
    
    // アクション実行
    const result = await this.performAction(action);
    
    // 成功イベント
    this.eventSystem.emit('action.success', { action, result });
    
    return result;
  } catch (error) {
    // エラー情報の拡充
    const enhancedError = this.errorHandler.enhanceError(error, {
      action,
      context: 'actionExecution',
      module: 'ActionManager'
    });
    
    // エラーイベント発火
    this.eventSystem.emit('action.error', { 
      action, 
      error: enhancedError 
    });
    
    // 状態復旧が必要ならロールバック
    if (this.stateManager.transactionInProgress) {
      this.stateManager.rollbackTransaction();
    }
    
    // エラーを上位に伝播
    throw enhancedError;
  }
}

// イベントベースのエラーハンドリング
setupErrorHandling() {
  // 重要なコンポーネントのエラー監視
  this.eventSystem.on('*.error', (eventName, data) => {
    const module = eventName.split('.')[0];
    
    this.logger.error(`Error in ${module}: ${data.error.message}`, {
      module,
      error: data.error,
      context: data.context
    });
    
    // UI通知用イベント（デバッグモードのみ）
    if (this.options.debugMode) {
      this.eventSystem.emit('debug.error', {
        module,
        error: data.error,
        time: new Date().toISOString()
      });
    }
  });
  
  // 致命的エラーの特別処理
  this.eventSystem.on('error.fatal', (data) => {
    this.logger.fatal(`Fatal error: ${data.error.message}`, {
      error: data.error,
      state: this.getGameState()
    });
    
    // ゲーム状態の保存を試行
    try {
      this.saveGameState('error_recovery_' + Date.now());
    } catch (e) {
      this.logger.error('Failed to save error recovery state', e);
    }
    
    // ゲーム中断イベント発火
    this.eventSystem.emit('game.interrupted', {
      reason: 'fatal_error',
      error: data.error
    });
  });
}
```

## 6. 実装例と進め方

実装を進める際の具体的なステップ例を示します：

### 6.1 PlayerManagerとRoleManagerの結合例

```javascript
// GameManagerでの初期設定
constructor(options) {
  // ...初期化コード...
  
  // PlayerManagerとRoleManagerの初期化
  this.playerManager = new PlayerManager(this.eventSystem, this.errorHandler);
  this.roleManager = new RoleManager(this.eventSystem, this.errorHandler);
  
  // イベントリスナー設定
  this.setupPlayerRoleInteraction();
}

// プレイヤーと役職の相互作用設定
setupPlayerRoleInteraction() {
  // 役職割り当てイベントのリスナー
  this.eventSystem.on('role.assigned', (data) => {
    const { playerId, roleName } = data;
    const player = this.playerManager.getPlayer(playerId);
    const role = this.roleManager.getRoleInstance(roleName);
    
    // プレイヤーに役職を設定
    player.setRole(role);
    
    // 役職にプレイヤーを関連付け
    role.assignToPlayer(playerId);
  });
  
  // プレイヤー死亡イベントのリスナー
  this.eventSystem.on('player.death', (data) => {
    const { playerId, cause } = data;
    const player = this.playerManager.getPlayer(playerId);
    
    // 役職の死亡ハンドラを呼び出し
    if (player.role) {
      player.role.onDeath(player, cause);
    }
    
    // 勝利条件のチェック
    this.victoryManager.checkWinCondition();
  });
}
```

### 6.2 パフォーマンス最適化とスケーラビリティ

より大規模なゲーム（多人数プレイや多くの役職）に対応するためのパフォーマンス最適化：

```javascript
// イベントリスナーの最適化
optimizeEventListeners() {
  // ハイボリュームイベントの処理最適化
  this.batchedVoteHandler = this.createBatchProcessor('vote.change', 10, 50, (events) => {
    // バッチ処理で複数の投票変更を一度に処理
    const voteChanges = events.map(e => e.data);
    this.processVoteBatch(voteChanges);
  });
  
  // 低頻度イベントは通常通り処理
  this.eventSystem.on('player.death', (data) => {
    this.handlePlayerDeath(data);
  });
}

// バッチ処理ヘルパー
createBatchProcessor(eventName, maxBatchSize, maxWaitTime, handler) {
  let batch = [];
  let timeoutId = null;
  
  const processBatch = () => {
    if (batch.length > 0) {
      const currentBatch = [...batch];
      batch = [];
      handler(currentBatch);
    }
    timeoutId = null;
  };
  
  // イベントリスナー
  const listener = (data) => {
    batch.push({ eventName, data, timestamp: Date.now() });
    
    // バッチサイズが最大に達したら即時処理
    if (batch.length >= maxBatchSize) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      processBatch();
    } 
    // タイムアウト設定
    else if (!timeoutId) {
      timeoutId = setTimeout(processBatch, maxWaitTime);
    }
  };
  
  this.eventSystem.on(eventName, listener);
  return listener; // リスナーを返して後で削除できるように
}

// メモリ使用量の最適化
optimizeMemoryUsage() {
  // ゲーム履歴の定期的な圧縮
  this.setupHistoryCompression();
  
  // 不要なオブジェクトの削除
  this.cleanupUnusedObjects();
}
```

### 6.3 API安定性とバージョニング

持続可能なAPIの設計と変更管理：

```javascript
class GameManager {
  constructor(options = {}) {
    // API仕様のバージョン
    this.apiVersion = '1.0.0';
    
    // 破壊的変更の検出
    if (options.apiCompatibility && !this.isCompatible(options.apiCompatibility)) {
      throw new Error(`API compatibility error: Required ${options.apiCompatibility}, but this is ${this.apiVersion}`);
    }
    
    // ...残りの初期化...
  }
  
  // API互換性チェック
  isCompatible(requiredVersion) {
    const current = this.apiVersion.split('.').map(Number);
    const required = requiredVersion.split('.').map(Number);
    
    // メジャーバージョンチェック（破壊的変更）
    return current[0] === required[0];
  }
  
  // 安定API - 互換性を維持
  addPlayer(name) {
    // v1以降互換性を保証
    return this.playerManager.addPlayer(name);
  }
  
  // 非推奨APIの処理
  removePlayer(id) {
    // 非推奨警告
    console.warn('removePlayer is deprecated, use deletePlayer instead');
    return this.deletePlayer(id);
  }
  
  // 新API
  deletePlayer(id) {
    return this.playerManager.removePlayer(id);
  }
  
  // 実験的API - 将来変更の可能性を明示
  _experimental_customRoleAssignment(assignments) {
    // 実験的機能の明示
    if (!this.options.allowExperimental) {
      throw new Error('Experimental API used without allowExperimental flag');
    }
    
    return this.roleManager.customAssign(assignments);
  }
}
```

## 7. まとめと実装のタイミング

### 7.1 結合実装の理想的なタイミング

```
Phase 1: コアモジュール確認と整備
  Week 1-2: EventSystem, ErrorSystem, Common/Utils

Phase 2: ドメインモデルの結合
  Week 3-4: Player, Role モデル
  Week 5-6: Phase, Action モデル

Phase 3: マネージャークラスの結合
  Week 7-8: PlayerManager, RoleManager
  Week 9-10: PhaseManager, VoteManager
  Week 11-12: ActionManager, VictoryManager

Phase 4: GameManagerによる統合
  Week 13-14: 基本統合とAPI設計
  Week 15-16: 全体テストと最適化
```

### 7.2 重要なマイルストーン

1. **コアインフラ完成**: EventSystem, ErrorSystem, Common/Utils の連携が動作
2. **ドメインモデル連携**: プレイヤーに役職を割り当て、フェーズ遷移が可能
3. **マネージャー連携**: 夜行動、投票、勝利判定が正しく機能
4. **完全統合**: 一連のゲームプレイが正常に完了

### 7.3 今後の拡張性を考慮した設計のポイント

1. **プラグインアーキテクチャ**: 新しい役職やルールを容易に追加できるプラグイン機構
2. **拡張イベント**: 将来の機能拡張のためのイベントフックの提供
3. **設定可能なコア**: レギュレーションや設定を変更可能な柔軟なコア設計
4. **明確なAPI境界**: 内部実装と公開APIの明確な分離

## 8. 結論

モジュール結合は、人狼ゲームGM支援ライブラリの機能を統合する重要なステップです。依存関係を明確に保ち、段階的なアプローチで進め、テストを重視することが成功の鍵となります。イベント駆動型のアーキテクチャを活用し、モジュール間の直接的な結合を最小限に抑えることで、柔軟性と拡張性に優れたライブラリを構築できるでしょう。

パフォーマンス、エラー処理、状態一貫性、API安定性などの重要な側面に注意を払いながら、段階的に実装を進めることで、高品質なライブラリの構築が可能になります。本ガイドを参考に、構造化された計画的なアプローチでモジュール結合を進めてください。
    