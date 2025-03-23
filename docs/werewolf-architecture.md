# 人狼ゲームGM支援ライブラリ アーキテクチャ設計書

## 1. システム概要

本ライブラリは、人狼ゲーム配信コミュニティのGM向けに、ゲーム進行の核となる処理を提供するJavaScriptライブラリです。Node.jsとブラウザの両環境で動作し、DiscordボットやOBS連携ツールなど様々なGMツールに組み込むことができます。

## 2. アーキテクチャ原則

- **イベント駆動型設計**: すべてのゲーム状態変化はイベントとして発火・伝播
- **モジュラー構造**: 機能別に分割された疎結合モジュール
- **プラグイン拡張性**: 特に役職追加を容易にする拡張機構
- **環境非依存**: Node.jsとブラウザの両方で動作する設計
- **自己完結性**: 外部依存を最小限に抑えた実装

## 3. 全体アーキテクチャ図

```
                  +---------------------+
                  |                     |
                  |    GameManager      |
                  |                     |
                  +---------+-----------+
                            |
              +-------------+-------------+
              |             |             |
    +---------v---+  +------v------+  +--v-----------+
    |             |  |             |  |              |
    | EventSystem |  | StateSystem |  | ErrorHandler |
    |             |  |             |  |              |
    +------+------+  +------+------+  +------+-------+
           |                |                |
           v                v                v
    +------+------+  +------+------+  +------+-------+
    |             |  |             |  |              |
    | PlayerModule|  | PhaseModule |  | ActionModule |
    |             |  |             |  |              |
    +------+------+  +------+------+  +------+-------+
           |                |                |
           v                v                v
    +------+------+  +------+------+  +------+-------+
    |             |  |             |  |              |
    | RoleModule  |  | VoteModule  |  | RuleModule   |
    |             |  |             |  |              |
    +-------------+  +-------------+  +--------------+
```

## 4. コアモジュール設計

### 4.1 GameManager

全体のコントロールを担当するコアモジュール。ゲームインスタンスを作成し、各モジュール間の調整を行います。

**主要クラス**: `WerewolfGame`

**責務**:
- ゲームインスタンスの作成と初期化
- コアモジュール間の調整
- ゲーム状態の保持
- 公開APIの提供

**主要メソッド**:
```javascript
createGame(options) // ゲームインスタンスを作成
start()             // ゲームを開始
nextPhase()         // 次のフェーズへ移行
getCurrentState()   // 現在のゲーム状態を取得
```

### 4.2 EventSystem

イベント駆動アーキテクチャの中核となるモジュール。イベントの発行、購読、管理を担当します。

**主要クラス**: `EventEmitter`

**責務**:
- イベントの登録と発行
- イベントリスナーの管理
- イベント伝播の制御

**主要メソッド**:
```javascript
on(eventName, callback)      // イベントリスナーを登録
once(eventName, callback)    // 一度だけ実行されるリスナーを登録
emit(eventName, data)        // イベントを発行
removeListener(eventName, callback) // リスナーを削除
```

### 4.3 StateSystem

ゲームの状態管理を担当するモジュール。状態変更とその履歴、シリアライズ/デシリアライズを扱います。

**主要クラス**: `GameState`

**責務**:
- ゲーム状態の保持と更新
- 状態変更履歴の管理
- 状態の永続化と復元

**主要メソッド**:
```javascript
updateState(partialState)    // 状態を部分的に更新
getState()                   // 現在の状態を取得
saveState()                  // 状態をシリアライズ
loadState(serializedState)   // 状態を復元
```

### 4.4 ErrorHandler

エラー処理を一元管理するモジュール。エラーの検出、報告、回復を担当します。

**主要クラス**: `ErrorManager`

**責務**:
- エラーの検出と分類
- エラーメッセージの生成
- エラー報告とログ記録
- 可能な場合の回復処理

**主要メソッド**:
```javascript
handleError(error, context)  // エラーを処理
setErrorPolicy(policy)       // エラー処理ポリシーを設定
validateOperation(operation) // 操作の妥当性を検証
```

## 5. 機能モジュール設計

### 5.1 PlayerModule

プレイヤー管理を担当するモジュール。プレイヤーの追加、削除、状態管理を扱います。

**主要クラス**: `PlayerManager`, `Player`

**責務**:
- プレイヤーの登録と削除
- プレイヤー情報の管理
- プレイヤー状態の変更追跡

**主要メソッド**:
```javascript
addPlayer(name)              // プレイヤーを追加
removePlayer(id)             // プレイヤーを削除
getPlayer(id)                // プレイヤー情報を取得
updatePlayerState(id, state) // プレイヤー状態を更新
getAlivePlayers()            // 生存プレイヤーを取得
```

### 5.2 RoleModule

役職関連の機能を担当するモジュール。役職の定義、配布、能力処理を扱います。

**主要クラス**: `RoleManager`, `Role` (基底クラス), 各種役職クラス

**責務**:
- 役職の定義と登録
- 役職の配布と割り当て
- 役職能力の処理
- 役職間の依存関係管理

**主要メソッド**:
```javascript
registerRole(roleDefinition) // カスタム役職を登録
distributeRoles(options)     // 役職を配布
getRoleInstance(roleName)    // 役職インスタンスを取得
checkRoleDependencies()      // 役職の依存関係をチェック
```

### 5.3 PhaseModule

ゲームフェーズの管理を担当するモジュール。フェーズの定義、遷移、処理を扱います。

**主要クラス**: `PhaseManager`, `Phase` (基底クラス), 各種フェーズクラス

**責務**:
- フェーズの定義と管理
- フェーズ遷移の制御
- フェーズ固有処理の実行

**主要メソッド**:
```javascript
definePhases(phaseDefinitions) // フェーズを定義
getCurrentPhase()              // 現在のフェーズを取得
moveToNextPhase()              // 次のフェーズへ移行
moveToPhase(phaseName)         // 指定フェーズへ移行
```

### 5.4 ActionModule

アクション処理を担当するモジュール。役職能力や特殊行動の実行と結果計算を扱います。

**主要クラス**: `ActionManager`, `Action` (基底クラス), 各種アクションクラス

**責務**:
- アクションの登録と管理
- アクション実行順序の制御
- アクション結果の計算
- アクション間の相互作用処理

**主要メソッド**:
```javascript
registerAction(action)          // アクションを登録
executeActions(phase, turn)     // アクションを実行
cancelAction(actionId)          // アクションをキャンセル
getActionResults(playerId)      // アクション結果を取得
```

### 5.5 VoteModule

投票処理を担当するモジュール。投票の受付、集計、結果処理を扱います。

**主要クラス**: `VoteManager`, `Vote`

**責務**:
- 投票の登録と変更
- 投票の集計と結果計算
- 決選投票の管理
- 処刑実行処理

**主要メソッド**:
```javascript
registerVote(voterId, targetId) // 投票を登録
changeVote(voterId, newTargetId) // 投票を変更
countVotes()                    // 投票を集計
executeVoteResult()             // 投票結果を実行
```

### 5.6 RuleModule

ゲームルールを管理するモジュール。レギュレーション設定や勝利条件判定を扱います。

**主要クラス**: `RuleManager`, `Regulation`

**責務**:
- ルール設定の管理
- 勝利条件の判定
- カスタムルールの適用
- ルール違反の検出

**主要メソッド**:
```javascript
setRegulation(regulationOptions) // レギュレーションを設定
checkWinCondition()             // 勝利条件をチェック
registerRuleAddon(addonDefinition) // ルールアドオンを登録
validateAction(action)          // アクションの妥当性を検証
```

## 6. 拡張点設計

### 6.1 役職拡張システム

カスタム役職を追加するための拡張システム。

**設計方針**:
- `Role` 基底クラスの継承による新役職の定義
- ライフサイクルメソッドのオーバーライドによる動作カスタマイズ
- メタデータによる役職情報の提供

**例**:
```javascript
class CustomRole extends werewolf.Role {
  constructor(game) {
    super(game);
    this.name = "customRole";
    this.team = "village";
    
    // メタデータ定義
    this.metadata = {
      displayName: "カスタム役職",
      description: "カスタム能力の説明",
      abilities: ["夜に特殊能力を使用可能"]
    };
  }
  
  // 夜行動処理をオーバーライド
  onNightAction(actor, target, night) {
    // カスタム処理
    return { success: true, result: "customResult" };
  }
  
  // その他のライフサイクルメソッド
  onTargeted(action) { /* ... */ }
  onDeath(player) { /* ... */ }
}

// 登録
werewolf.registerRole("customRole", CustomRole);
```

### 6.2 ルールアドオンシステム

ゲームルールをカスタマイズするためのアドオンシステム。

**設計方針**:
- イベントフックによるゲーム進行への介入
- 専用APIによるルール変更の実装
- インターフェース定義によるアドオン構造の標準化

**例**:
```javascript
werewolf.registerRuleAddon("customRule", {
  // 初期化処理
  init: (game, options) => {
    // ゲーム開始時の設定
    game.customRuleData = { counter: 0 };
    
    // イベントリスナー登録
    game.on("turnStart", (data) => {
      game.customRuleData.counter++;
      // カスタムルール処理
    });
  },
  
  // カスタムメソッド
  checkCustomCondition: (game) => {
    // 条件チェック処理
    return game.customRuleData.counter > 5;
  },
  
  // 終了処理
  cleanup: (game) => {
    // リソース解放等
  }
});

// 使用
game.enableRuleAddon("customRule", { customOption: true });
```

## 7. インターフェース設計

### 7.1 外部API

ライブラリ利用者が使用する主要なパブリックAPI。

```javascript
// ゲーム作成と設定
const werewolf = require('werewolf-gm-lib');
const game = werewolf.createGame({
  // ゲーム設定
});

// プレイヤー管理
game.addPlayer("プレイヤー1");
game.removePlayer(playerId);

// 役職設定
game.setRoles(['villager', 'werewolf', 'seer']);
game.distributeRoles();

// ゲーム進行
game.start();
game.nextPhase();
game.endTurn();

// アクション登録
game.registerAction({
  type: 'fortune',
  actor: playerId,
  target: targetId
});

// 投票処理
game.vote(voterId, targetId);
game.executeVote();

// イベントリスニング
game.on('playerDeath', (data) => {
  // イベント処理
});

// 状態取得
const state = game.getCurrentState();
```

### 7.2 プラグインAPI

ライブラリを拡張するためのAPI。

```javascript
// カスタム役職の登録
werewolf.registerRole("customRole", CustomRoleClass);

// ルールアドオンの登録
werewolf.registerRuleAddon("customRule", ruleDefinition);

// イベントのカスタマイズ
werewolf.registerEvent("customEvent", eventDefinition);

// カスタム勝利条件の登録
werewolf.registerWinCondition("customWin", conditionDefinition);
```

## 8. 状態モデル

### 8.1 ゲーム状態

ゲーム全体の状態を表すデータモデル。

```javascript
{
  id: "game-123",         // ゲームID
  phase: "night",         // 現在のフェーズ
  turn: 2,                // 現在のターン
  players: [ /* ... */ ], // プレイヤーリスト
  roles: { /* ... */ },   // 役職設定
  votes: [ /* ... */ ],   // 投票状況
  actions: [ /* ... */ ], // アクション履歴
  regulation: { /* ... */ }, // レギュレーション設定
  history: [ /* ... */ ], // ゲーム履歴
  winner: null,           // 勝者（ゲーム終了時）
  timestamp: 1621234567   // 最終更新時刻
}
```

### 8.2 プレイヤーモデル

個々のプレイヤーを表すデータモデル。

```javascript
{
  id: 0,                  // プレイヤーID
  name: "プレイヤー1",     // プレイヤー名
  role: "werewolf",       // 役職
  isAlive: true,          // 生存状態
  causeOfDeath: null,     // 死因
  deathTurn: null,        // 死亡ターン
  statusEffects: [],      // 状態効果
  votes: []               // 投票履歴
}
```

## 9. イベントフロー

代表的なゲーム進行における主要なイベントフロー。

### 9.1 ゲーム開始シーケンス

1. `gameSetup` - ゲーム設定完了時
2. `roleDistribution` - 役職配布時
3. `gameStart` - ゲーム開始時
4. `phaseStart:preparation` - 準備フェーズ開始時
5. `phaseEnd:preparation` - 準備フェーズ終了時
6. `phaseStart:night` - 初日夜フェーズ開始時

### 9.2 夜アクション実行シーケンス

1. `actionRegistered` - アクション登録時
2. `nightActionStart` - 夜アクション処理開始時
3. `roleActionStart:seer` - 占い師行動開始時
4. `targetSelected` - 対象選択時
5. `roleActionResult:seer` - 占い結果確定時
6. `roleActionStart:werewolf` - 人狼行動開始時
7. `attackRegistered` - 襲撃登録時
8. `attackResolved` - 襲撃結果確定時
9. `playerDeath` - プレイヤー死亡時（襲撃成功の場合）
10. `nightActionEnd` - 夜アクション処理終了時

### 9.3 投票処理シーケンス

1. `phaseStart:vote` - 投票フェーズ開始時
2. `voteRegistered` - 投票登録時
3. `voteChanged` - 投票変更時
4. `voteCounted` - 投票集計時
5. `voteTie` - 同票発生時
6. `runoffVoteStart` - 決選投票開始時
7. `executionTarget` - 処刑対象決定時
8. `playerDeath` - プレイヤー死亡時（処刑実行）
9. `phaseEnd:vote` - 投票フェーズ終了時

## 10. セキュリティと制約事項

### 10.1 セキュリティ考慮事項

- プレイヤー識別子はライブラリ内部で生成し、外部IDとのマッピングはアプリケーション側に委ねる
- 情報可視性管理は選択的に有効化できるオプション機能として提供
- エラー情報が機密データを漏洩しないよう注意

### 10.2 パフォーマンス考慮事項

- イベントリスナーの過剰登録を防ぐメカニズム
- 大量のゲーム履歴データの効率的な管理
- メモリ使用量の監視と最適化

### 10.3 拡張性の制約

- 基本ゲームロジックの変更は許可しない
- プラグインによる役職やルール追加は標準インターフェースに従う必要がある
- 破壊的な拡張はメジャーバージョン更新時のみ許可
