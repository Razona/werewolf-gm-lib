# 人狼ゲームGM支援ライブラリ モジュール構成と依存関係設計書（更新版）

## 1. 概要

本設計書では、人狼ゲームGM支援ライブラリのモジュール構成と依存関係について定義します。システム全体のアーキテクチャ、各モジュールの責務、モジュール間の関係性を明確にすることで、保守性と拡張性の高いライブラリ構造を設計します。

本設計書では、初期バージョンでの実装範囲と将来的な拡張モジュールを明確に区別します。特に、状態保存・復元システムは初期バージョンでは組み込まず、将来の拡張モジュールとして位置づけます。

## 2. 設計原則

以下の原則に基づいてモジュール構成を設計します：

- **関心の分離**: 各モジュールは明確に定義された責務を持つ
- **依存関係の明確化**: モジュール間の依存方向を明示的に定義
- **循環依存の回避**: モジュール間の循環依存を作らない
- **インターフェース駆動**: モジュール間の通信は明確なインターフェースを通じて行う
- **拡張性**: 機能拡張が容易な構造
- **レイヤー化**: 適切な抽象化レベルでのレイヤー構造
- **オプショナル依存**: 将来モジュールへの依存は任意とし、存在しなくても動作する設計

## 3. システム全体のアーキテクチャ

### 3.1 全体構造

人狼ゲームGM支援ライブラリは以下の主要レイヤーで構成されます：

1. **コアレイヤー**: 基本的なインフラストラクチャと共通機能
2. **ドメインレイヤー**: ゲームのドメインロジック
3. **サービスレイヤー**: 各種ゲーム機能を提供するサービス
4. **インターフェースレイヤー**: 外部との通信インターフェース

これらのレイヤーは以下のような依存関係を持ちます：

```
インターフェースレイヤー → サービスレイヤー → ドメインレイヤー → コアレイヤー
```

### 3.2 ハイレベルモジュール構成図

#### 初期バージョンのモジュール構成

```
+---------------------------+
|  Public API Interface     |
+------+-----------+--------+
       |           |
       v           v
+------+----+ +----+-------+
|  Game     | | Extensions |
| Manager   | | Manager    |
+------+----+ +----+-------+
       |           |
       v           v
+------+----+ +----+-------+ +-------+
|  Core     | | Domain     | | Utils |
| Services  | | Services   | |       |
+------+----+ +----+-------+ +---+---+
       |           |             |
       v           v             v
+------+----+ +----+-------+ +---+---+
| Common    | | Domain     | | Error |
| Primitives| | Models     | | System|
+------+----+ +----+-------+ +-------+
```

#### 将来拡張を含めたモジュール構成

```
+---------------------------+
|  Public API Interface     |
+------+-----------+--------+
       |           |
       v           v
+------+----+ +----+-------+
|  Game     | | Extensions |
| Manager   | | Manager    |
+------+----+ +----+-------+
       |           |
       v           v
+------+----+ +----+-------+ +-------+  +-----------+
|  Core     | | Domain     | | Utils |  | Future    |
| Services  | | Services   | |       |  | Modules   |
+------+----+ +----+-------+ +---+---+  +-----------+
       |           |             |            |
       v           v             v            v
+------+----+ +----+-------+ +---+---+  +-----------+
| Common    | | Domain     | | Error |  | State     |
| Primitives| | Models     | | System|  | Manager   |
+------+----+ +----+-------+ +-------+  +-----------+
                                        +-----------+
                                        | Visibility|
                                        | Manager   |
                                        +-----------+
```

## 4. 主要モジュール定義

### 4.1 コアレイヤー（初期バージョン）

#### 4.1.1 Common（共通モジュール）

- **責務**: 基本的なデータ構造、定数、ユーティリティ関数の提供
- **主要コンポーネント**:
  - Constants: ゲーム内定数とデフォルト値
  - Types: 共通の型定義
  - Utils: ユーティリティ関数
- **依存モジュール**: なし（最下層モジュール）

#### 4.1.2 EventSystem（イベントシステムモジュール）

- **責務**: イベントの発行、購読、管理
- **主要コンポーネント**:
  - EventEmitter: イベント発行・購読の基本機能
  - EventRegistry: イベント定義の登録
  - EventHistory: イベント履歴の管理
- **依存モジュール**: Common

#### 4.1.3 ErrorSystem（エラー処理モジュール）

- **責務**: エラー定義、検証、処理
- **主要コンポーネント**:
  - ErrorCatalog: エラー定義のカタログ
  - ErrorHandler: エラー処理ロジック
  - Validator: 入力検証
- **依存モジュール**: Common, EventSystem

### 4.2 ドメインレイヤー（初期バージョン）

#### 4.2.1 PlayerModel（プレイヤーモデルモジュール）

- **責務**: プレイヤー情報の管理
- **主要コンポーネント**:
  - Player: プレイヤークラス
  - PlayerFactory: プレイヤー生成
  - PlayerCollection: プレイヤー集合管理
- **依存モジュール**: Common, EventSystem, ErrorSystem

#### 4.2.2 RoleModel（役職モデルモジュール）

- **責務**: 役職の定義と基本機能
- **主要コンポーネント**:
  - Role: 役職基底クラス
  - TeamDefinition: 陣営定義
  - RoleFactory: 役職インスタンスの生成
- **依存モジュール**: Common, EventSystem, ErrorSystem

#### 4.2.3 PhaseModel（フェーズモデルモジュール）

- **責務**: ゲームフェーズの定義
- **主要コンポーネント**:
  - Phase: フェーズクラス
  - PhaseTransition: フェーズ遷移定義
  - PhaseContext: フェーズコンテキスト
- **依存モジュール**: Common, EventSystem, ErrorSystem

#### 4.2.4 ActionModel（アクションモデルモジュール）

- **責務**: ゲーム内アクションの定義
- **主要コンポーネント**:
  - Action: アクションクラス
  - ActionResult: アクション結果
  - ActionType: アクションタイプ定義
- **依存モジュール**: Common, EventSystem, ErrorSystem

#### 4.2.5 VoteModel（投票モデルモジュール）

- **責務**: 投票の基本データモデル
- **主要コンポーネント**:
  - Vote: 投票クラス
  - VoteResult: 投票結果
  - VoteType: 投票タイプ定義
- **依存モジュール**: Common, EventSystem, ErrorSystem, PlayerModel

#### 4.2.6 VictoryModel（勝利条件モデルモジュール）

- **責務**: 勝利条件の定義
- **主要コンポーネント**:
  - VictoryCondition: 勝利条件クラス
  - TeamVictory: 陣営別勝利条件
  - GameResult: ゲーム結果
- **依存モジュール**: Common, EventSystem, ErrorSystem, RoleModel

### 4.3 サービスレイヤー（初期バージョン）

#### 4.3.1 PlayerManager（プレイヤー管理サービス）

- **責務**: プレイヤーの追加、削除、状態管理
- **主要コンポーネント**:
  - PlayerRegistry: プレイヤー登録
  - PlayerStateManager: プレイヤー状態管理
  - PlayerQuery: プレイヤー情報取得
- **依存モジュール**: Common, EventSystem, ErrorSystem, PlayerModel

#### 4.3.2 RoleManager（役職管理サービス）

- **責務**: 役職の登録、配布、能力管理
- **主要コンポーネント**:
  - RoleRegistry: 役職登録
  - RoleDistributor: 役職配布
  - RoleAbilityController: 役職能力制御
- **依存モジュール**: Common, EventSystem, ErrorSystem, RoleModel, PlayerModel

#### 4.3.3 PhaseManager（フェーズ管理サービス）

- **責務**: ゲームフェーズの管理と遷移制御
- **主要コンポーネント**:
  - PhaseController: フェーズ制御
  - TransitionEngine: 遷移エンジン
  - PhaseHistory: フェーズ履歴
- **依存モジュール**: Common, EventSystem, ErrorSystem, PhaseModel

#### 4.3.4 ActionManager（アクション管理サービス）

- **責務**: アクションの登録、検証、実行
- **主要コンポーネント**:
  - ActionRegistry: アクション登録
  - ActionValidator: アクション検証
  - ActionExecutor: アクション実行
  - ActionResultStore: アクション結果保存
- **依存モジュール**: Common, EventSystem, ErrorSystem, ActionModel, PlayerModel, RoleModel

#### 4.3.5 VoteManager（投票管理サービス）

- **責務**: 投票の受付、集計、結果処理
- **主要コンポーネント**:
  - VoteCollector: 投票受付
  - VoteCounter: 投票集計
  - RunoffResolver: 決選投票処理
  - ExecutionHandler: 処刑処理
- **依存モジュール**: Common, EventSystem, ErrorSystem, VoteModel, PlayerModel

#### 4.3.6 VictoryManager（勝利条件管理サービス）

- **責務**: 勝利条件の登録、判定、結果通知
- **主要コンポーネント**:
  - VictoryRegistry: 勝利条件登録
  - VictoryEvaluator: 勝利条件評価
  - GameEndHandler: ゲーム終了処理
- **依存モジュール**: Common, EventSystem, ErrorSystem, VictoryModel, PlayerModel, RoleModel

### 4.4 インターフェースレイヤー（初期バージョン）

#### 4.4.1 GameManager（ゲーム管理モジュール）

- **責務**: ライブラリのメインエントリーポイント、全体制御
- **主要コンポーネント**:
  - GameSetup: ゲーム設定
  - GameController: ゲーム制御
  - GameInfo: ゲーム情報提供
- **依存モジュール**: すべての初期バージョンサービスレイヤーモジュール

#### 4.4.2 ExtensionManager（拡張管理モジュール）

- **責務**: プラグインや拡張機能の管理
- **主要コンポーネント**:
  - PluginRegistry: プラグイン登録
  - ExtensionLoader: 拡張機能読み込み
  - AddonManager: アドオン管理
- **依存モジュール**: すべての初期バージョンサービスレイヤーモジュールと一部のドメインレイヤーモジュール

### 4.5 将来追加予定のモジュール

#### 4.5.1 StateManager（状態管理サービス）

- **責務**: ゲーム全体の状態管理、保存、復元
- **主要コンポーネント**:
  - GameState: ゲーム状態
  - StateSerializer: 状態シリアライザ
  - StateChangeTracker: 状態変更追跡
- **依存モジュール**: Common, EventSystem, ErrorSystem, PlayerModel, RoleModel, PhaseModel
- **注意**: 初期バージョンでは実装しない将来拡張モジュール

#### 4.5.2 VisibilityManager（情報可視性管理サービス）

- **責務**: プレイヤーごとの情報可視性制御
- **主要コンポーネント**:
  - VisibilityPolicy: 可視性ポリシー
  - VisibilityFilter: 情報フィルタリング
  - ViewGenerator: 視点別ビュー生成
- **依存モジュール**: Common, EventSystem, ErrorSystem, PlayerModel, RoleModel
- **注意**: オプショナル機能として設計し、デフォルトでは無効

## 5. モジュール間の依存関係

### 5.1 依存関係図（初期バージョン）

以下に初期バージョンの主要モジュール間の依存関係を示します。矢印は依存の方向を表します：

```
                    +---------------+
                    | GameManager   |
                    +-------+-------+
                            |
                            v
+------------+     +--------+----------+
| Extension  |<--->| Service Layer     |
| Manager    |     | (各種マネージャー) |
+------------+     +--------+----------+
                            |
                            v
                   +--------+----------+
                   | Domain Layer      |
                   | (各種モデル)       |
                   +--------+----------+
                            |
                            v
                   +--------+----------+
                   | Core Layer        |
                   | (共通機能・イベント)|
                   +-------------------+
```

### 5.2 直接依存関係マトリックス（初期バージョン）

以下の表は、行のモジュールが列のモジュールに依存している関係を示します（○は依存あり）：

| モジュール       | Common | Event | Error | Player | Role | Phase | Action | Vote | Victory |
|----------------|--------|-------|-------|--------|------|-------|--------|------|---------|
| Common         |        |       |       |        |      |       |        |      |         |
| EventSystem    | ○      |       |       |        |      |       |        |      |         |
| ErrorSystem    | ○      | ○     |       |        |      |       |        |      |         |
| PlayerModel    | ○      | ○     | ○     |        |      |       |        |      |         |
| RoleModel      | ○      | ○     | ○     |        |      |       |        |      |         |
| PhaseModel     | ○      | ○     | ○     |        |      |       |        |      |         |
| ActionModel    | ○      | ○     | ○     |        |      |       |        |      |         |
| VoteModel      | ○      | ○     | ○     | ○      |      |       |        |      |         |
| VictoryModel   | ○      | ○     | ○     |        | ○    |       |        |      |         |
| PlayerManager  | ○      | ○     | ○     | ○      |      |       |        |      |         |
| RoleManager    | ○      | ○     | ○     | ○      | ○    |       |        |      |         |
| PhaseManager   | ○      | ○     | ○     |        |      | ○     |        |      |         |
| ActionManager  | ○      | ○     | ○     | ○      | ○    |       | ○      |      |         |
| VoteManager    | ○      | ○     | ○     | ○      |      |       |        | ○    |         |
| VictoryManager | ○      | ○     | ○     | ○      | ○    |       |        |      | ○       |
| GameManager    | ○      | ○     | ○     | ○      | ○    | ○     | ○      | ○    | ○       |
| ExtensionManager| ○     | ○     | ○     | ○      | ○    | ○     | ○      | ○    | ○       |

### 5.3 将来モジュールと初期モジュールの依存関係

将来モジュールは初期モジュールに依存しますが、初期モジュールは将来モジュールに直接依存しないように設計します：

```
初期モジュール ⟵ 将来モジュール（StateManager, VisibilityManager）
```

将来モジュールを組み込む場合の拡張ポイントを初期モジュールに設けることで、将来モジュールが追加された場合に連携できるようにします。

## 6. モジュール間通信

### 6.1 通信パターン

モジュール間の通信には主に以下のパターンを使用します：

1. **直接メソッド呼び出し**: 上位レイヤーから下位レイヤーへの依存による直接呼び出し
2. **イベント駆動**: 疎結合な通信のためのイベント発行・購読
3. **インターフェース経由**: 明示的なインターフェースを通じた通信
4. **コンテキスト共有**: 共有コンテキストを通じた状態参照

### 6.2 主要イベントフロー

各モジュールが発行・購読する主要イベントの例：

- `player.add` → PlayerManager→RoleManager, ... (StateManager)
- `role.distribute` → RoleManager→PlayerManager, ... (StateManager)
- `phase.change` → PhaseManager→ActionManager, VoteManager, ...
- `action.execute` → ActionManager→RoleManager, PlayerManager, ...
- `vote.submit` → VoteManager→PlayerManager, ... (StateManager)
- `victory.check` → VictoryManager→GameManager, ... (StateManager)

**注**: カッコ内のStateManagerは将来追加予定のモジュールを示しており、初期バージョンでは存在しません。

### 6.3 StateManagerなしでの運用

StateManagerが存在しない初期バージョンでは、以下の方法で状態管理を行います：

1. **メモリ内状態**: 各マネージャーがメモリ内で自身の状態を管理
2. **イベントによる同期**: 状態変更時にイベントを発火し、他のマネージャーが購読して状態を同期
3. **GameManagerによる集約**: GameManagerが必要な状態を集約して提供

例えば、ゲーム状態の取得は以下のように実装できます：

```javascript
// StateManagerなしでのゲーム状態取得
getGameState() {
  return {
    // 各マネージャーから必要な状態を収集
    players: this.playerManager.getPlayers(),
    phase: this.phaseManager.getCurrentPhase(),
    turn: this.phaseManager.getCurrentTurn(),
    roles: this.roleManager.getRolesDistribution(),
    votes: this.voteManager.getCurrentVotes(),
    // ...その他の状態情報
  };
}
```

### 6.4 将来モジュールの統合方法

将来モジュールを追加する際の拡張ポイント：

1. **拡張フック**: 初期モジュールに拡張フックを設け、将来モジュールが利用可能な場合に連携
2. **条件付きイベント購読**: 将来モジュールは既存イベントを購読し、機能を拡張
3. **プラグインシステム**: ExtensionManagerを通じた機能拡張メカニズム

例：

```javascript
// 状態保存機能の拡張ポイント例
class GameManager {
  // ...
  
  // 拡張ポイント
  saveGameState() {
    // StateManagerが登録されているか確認
    if (this.hasExtension('stateManager')) {
      // StateManagerを使用
      return this.getExtension('stateManager').saveState();
    }
    
    // StateManagerがない場合は機能未サポートとして通知
    this.eventSystem.emit('game.warning', {
      code: 'FEATURE_NOT_AVAILABLE',
      message: '状態保存機能は現在利用できません'
    });
    
    return null;
  }
}
```

## 7. パッケージング構造

### 7.1 ディレクトリ構造

プロジェクトのディレクトリ構造を以下のように整理します。初期バージョンでは「future」ディレクトリの内容は実装しません。

```
werewolf-gm-lib/
├── src/
│   ├── core/
│   │   ├── common/
│   │   ├── event/
│   │   └── error/
│   ├── domain/
│   │   ├── player/
│   │   ├── role/
│   │   ├── phase/
│   │   ├── action/
│   │   ├── vote/
│   │   └── victory/
│   ├── service/
│   │   ├── player/
│   │   ├── role/
│   │   ├── phase/
│   │   ├── action/
│   │   ├── vote/
│   │   └── victory/
│   ├── interface/
│   │   ├── game/
│   │   └── extension/
│   ├── future/           // 将来実装予定のモジュール
│   │   ├── state/        // 状態管理・保存・復元
│   │   └── visibility/   // 情報可視性管理
│   └── index.js
├── dist/
├── test/
├── examples/
├── docs/
└── package.json
```

### 7.2 公開モジュール

外部に公開するAPIを含むモジュール：

- GameManager（メインエントリーポイント）
- ExtensionManager（プラグインAPI）
- 一部のドメインオブジェクト（拡張用）
- ユーティリティ関数

### 7.3 内部モジュール

ライブラリ内部でのみ使用されるモジュール：

- 各種サービスの内部実装
- 内部ユーティリティ
- 内部イベントハンドラ
- 内部状態管理

## 8. 拡張機構

### 8.1 主要拡張ポイント

ライブラリの拡張を可能にするポイント：

1. **役職の拡張**: カスタム役職の追加
2. **アクションの拡張**: カスタムアクションタイプの追加
3. **フェーズの拡張**: カスタムゲームフェーズの追加
4. **勝利条件の拡張**: カスタム勝利条件の追加
5. **イベントハンドラ**: カスタムイベントハンドラの追加

### 8.2 将来モジュールのための拡張ポイント

将来モジュールを組み込むための拡張ポイント：

1. **状態管理拡張ポイント**:
   - GameManagerに状態管理用のフック設定
   - 各マネージャーに状態シリアライズ用のメソッド追加
   - 状態変更イベントを発火

2. **情報可視性管理拡張ポイント**:
   - 情報取得メソッドに視点引数を追加
   - 役職の情報公開メソッドを実装
   - 外部フィルタリング用のインターフェース提供

例：
```javascript
// 情報可視性管理のための拡張ポイント例
class RoleManager {
  // ...
  
  getRoleInfo(roleId, viewerId = null) {
    const role = this.roles.get(roleId);
    if (!role) return null;
    
    // VisibilityManagerがあるかチェック
    if (this.game.hasExtension('visibilityManager') && viewerId !== null) {
      // VisibilityManagerを使用
      return this.game.getExtension('visibilityManager')
        .getFilteredRoleInfo(role, viewerId);
    }
    
    // 情報可視性管理がない場合は完全情報を返す
    return this.getFullRoleInfo(role);
  }
}
```

### 8.3 プラグインシステム

プラグインの登録と適用の仕組み：

```
プラグイン → ExtensionManager → 各マネージャモジュール → 機能拡張
```

プラグインは特定のインターフェースに従い、ExtensionManagerを通じて登録されます。
ExtensionManagerは適切なサービスモジュールにプラグイン機能を渡し、そのサービスが実際の拡張を実施します。

## 9. 依存性管理

### 9.1 外部依存関係

本ライブラリの外部依存を極力最小化します：

- **必須依存**: なし（自己完結型ライブラリ）
- **オプション依存**: 
  - イベントエミッター（小規模な実装を内包も可能）
  - 乱数生成ライブラリ（必要に応じて）
  - シリアライゼーションライブラリ（StateManager実装時のみ）

### 9.2 ランタイム環境互換性

以下の環境での動作を想定します：

- Node.js 12以上
- モダンブラウザ (ES6互換)
- webpack/rollupなどのバンドラと互換

### 9.3 Optional Chainingパターン

将来モジュールへの依存を任意にするため、Optional Chainingパターンを使用します：

```javascript
// Optional Chainingパターンの例
function saveGameState() {
  // stateManager存在チェックと呼び出しを一度に行う
  return this.extensions?.stateManager?.saveState?.() || null;
}

// 条件付きロジック実行の例
function getPlayerView(playerId, viewerId) {
  // visibilityManagerが存在し、有効な場合のみフィルタリング
  if (this.extensions?.visibilityManager?.isEnabled?.()) {
    return this.extensions.visibilityManager.getViewForPlayer(playerId, viewerId);
  }
  
  // 存在しない場合はデフォルトの完全情報を返す
  return this.getFullPlayerInfo(playerId);
}
```

## 10. 具体的な使用例

### 10.1 基本的な使用例（初期バージョン）

```javascript
// ライブラリの初期化
const werewolf = require('werewolf-gm-lib');

// ゲームインスタンスの作成
const game = werewolf.createGame({
  // 基本オプション
});

// プレイヤー追加
game.addPlayer("プレイヤー1");
game.addPlayer("プレイヤー2");
// ...

// 役職設定
game.setRoles(['villager', 'werewolf', 'seer']);

// ゲーム開始
game.start();

// ゲーム進行
game.nextPhase();

// イベント購読
game.on('player.death', (data) => {
  console.log(`プレイヤー${data.playerId}が死亡しました`);
});
```

### 10.2 将来モジュールを使用する例

```javascript
// 将来バージョンでの使用例
const game = werewolf.createGame({
  options: {
    // 状態保存機能を有効化（将来バージョン）
    stateManagement: {
      enabled: true,
      autoSave: false,
      saveFormat: 'json'
    },
    
    // 情報可視性管理を有効化（将来バージョン）
    visibilityControl: {
      enabled: true,
      strictMode: false
    }
  }
});

// 情報可視性を考慮したビュー取得
const playerView = game.getViewForPlayer(playerId);

// 状態保存（将来バージョン）
const savedState = game.saveState();
```

## 11. 実装の優先順位

### 11.1 初期バージョンの範囲（MVP）

明確に定義された初期バージョンの実装範囲：

1. **コアモジュール**:
   - Common: 共通ユーティリティと基本データ構造
   - EventSystem: イベント管理システム
   - ErrorSystem: エラー処理システム

2. **ドメインモデル**:
   - Player: プレイヤーモデル
   - Role: 役職モデル（基本役職のみ）
   - Phase: フェーズモデル
   - Action: アクションモデル
   - Vote: 投票モデル
   - Victory: 勝利条件モデル

3. **サービスモジュール**:
   - PlayerManager: プレイヤー管理
   - RoleManager: 役職管理
   - PhaseManager: フェーズ管理
   - ActionManager: アクション管理
   - VoteManager: 投票管理
   - VictoryManager: 勝利条件管理

4. **インターフェース**:
   - GameManager: ゲーム管理
   - ExtensionManager: 拡張管理（基本機能のみ）

### 11.2 除外される機能（将来バージョン用）

初期バージョンでは以下の機能を実装しません：

1. **状態保存・復元システム**:
   - ゲーム状態のシリアライズ
   - 状態の永続化
   - 状態からの復元

2. **情報可視性管理システム（オプション機能）**:
   - プレイヤー視点のフィルタリング
   - 役職による情報アクセス制御
   - 視点ベースのビュー生成

ただし、将来これらの機能を追加できるよう拡張ポイントを設けます。

### 11.3 段階的な実装計画

1. **フェーズ1**: コア機能と基本プレイ（MVP）
   - コアモジュール（Common, EventSystem, ErrorSystem）
   - 基本ドメインモデル（Player, Role - 村人・人狼のみ）
   - 基本サービス（PlayerManager, RoleManager, PhaseManager）
   - シンプルなゲーム管理（GameManager - 基本機能のみ）

2. **フェーズ2**: 全役職と投票システム
   - 全役職実装（占い師、霊媒師、騎士、狂人、妖狐、背徳者、共有者）
   - 投票システム（VoteManager, VoteModel）
   - フェーズ遷移の拡充

3. **フェーズ3**: アクション処理と勝利条件
   - アクションシステム（ActionManager, ActionModel）
   - 勝利条件システム（VictoryManager, VictoryModel）
   - 拡張ポイントの整備

4. **フェーズ4**: 将来モジュールの拡張ポイント
   - 状態管理拡張ポイントの準備
   - 情報可視性管理拡張ポイントの準備
   - ExtensionManagerの拡充

## 12. 将来拡張モジュール

### 12.1 StateManager（状態管理システム）

将来のバージョンで実装予定の状態管理システムの概要：

- **主要機能**:
  - ゲーム状態のスナップショット作成
  - 状態のシリアライズ（JSON形式）
  - ファイルまたはデータベースへの永続化
  - 保存した状態からの復元

- **拡張ポイント**:
  - 各マネージャクラスに状態シリアライズメソッド
  - 復元用のファクトリメソッド
  - 状態変更イベント

- **GameManagerとの統合**:
  ```javascript
  // 将来のStateManager統合例
  class GameManager {
    // ...
    
    // StateManagerの登録
    registerStateManager(stateManager) {
      this.extensions = this.extensions || {};
      this.extensions.stateManager = stateManager;
      
      // StateManagerを各マネージャに紹介
      this.playerManager.onStateManagerAvailable(stateManager);
      this.roleManager.onStateManagerAvailable(stateManager);
      // 他のマネージャーも同様...
    }
    
    // 状態保存操作
    saveGameState() {
      if (this.extensions?.stateManager) {
        return this.extensions.stateManager.saveState();
      }
      return null; // 未サポート
    }
    
    // 状態復元操作
    loadGameState(state) {
      if (this.extensions?.stateManager) {
        return this.extensions.stateManager.loadState(state);
      }
      return false; // 未サポート
    }
  }
  ```

### 12.2 VisibilityManager（情報可視性管理システム）

将来オプションとして実装予定の情報可視性管理システムの概要：

- **主要機能**:
  - プレイヤー視点のゲーム情報フィルタリング
  - 役職に基づく情報アクセス制御
  - 死亡プレイヤーの情報アクセス制御
  - GMモードの提供

- **拡張ポイント**:
  - 情報取得メソッドの視点パラメータ
  - 役職の情報公開ルール定義
  - フィルタリングインターフェース

- **GameManagerとの統合**:
  ```javascript
  // 将来のVisibilityManager統合例
  class GameManager {
    // ...
    
    // VisibilityManagerの登録
    setVisibilityControl(options) {
      if (options.enabled) {
        if (!this.extensions?.visibilityManager) {
          // VisibilityManagerインスタンス作成
          this.extensions = this.extensions || {};
          this.extensions.visibilityManager = new VisibilityManager(this, options);
        } else {
          // 既存のインスタンスを更新
          this.extensions.visibilityManager.updateOptions(options);
        }
      } else if (this.extensions?.visibilityManager) {
        // 無効化
        this.extensions.visibilityManager.setEnabled(false);
      }
    }
    
    // プレイヤー視点のビュー取得
    getViewForPlayer(playerId) {
      if (this.extensions?.visibilityManager?.isEnabled()) {
        return this.extensions.visibilityManager.getViewForPlayer(playerId);
      }
      
      // 情報可視性管理がない場合は完全情報を返す
      return this.getFullGameState();
    }
  }
  ```

## 13. まとめ

本設計書では、人狼ゲームGM支援ライブラリのモジュール構成と依存関係を定義しました。以下の特徴を持つモジュール設計を行いました：

1. **明確な初期バージョン**: 初期実装に含まれるモジュールを明確に定義
2. **将来拡張の準備**: 状態管理や情報可視性管理のための拡張ポイントを設計
3. **階層化されたモジュール構造**: コア、ドメイン、サービス、インターフェースの各層に分割
4. **明確な責務分担**: 各モジュールが特定の機能に責任を持つ
5. **制御された依存関係**: 下位から上位への依存を避け、循環依存を防止
6. **イベント駆動型通信**: モジュール間の疎結合な連携のためのイベントシステム

この設計に基づくことで、モジュール単位での開発・テスト・保守が容易になり、将来的な機能拡張にも対応できる柔軟性の高いライブラリを実現できます。特に、初期バージョンから除外される状態保存・復元システムを後から追加できる拡張性を確保しつつ、機能的なMVP（最小実行製品）を提供できる設計となっています。

以下の図は、初期バージョンのライブラリ全体のモジュール依存関係を表現したものです：

```
┌─────────────────────────────────────────────────────────────┐
│                    公開 API インターフェース                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┴──────────────┐
            │                              │
┌───────────▼───────────┐      ┌───────────▼───────────┐
│     GameManager        │      │    ExtensionManager   │
└───────────┬───────────┘      └───────────┬───────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
┌─────────────────────────▼─────────────────────────┐
│                  サービスレイヤー                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Player   │ │  Role    │ │  Phase   │ │ Action  │ │
│  │ Manager  │ │ Manager  │ │ Manager  │ │ Manager │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│                                                      │
│  ┌──────────┐ ┌──────────┐                          │
│  │  Vote    │ │ Victory  │                          │
│  │ Manager  │ │ Manager  │                          │
│  └──────────┘ └──────────┘                          │
└────────────────────┬──────────────────────────────┘
                     │
┌───────────────────▼──────────────────────────────┐
│                ドメインレイヤー                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Player   │ │  Role    │ │  Phase   │ │ Action │ │
│  │ Model    │ │ Model    │ │ Model    │ │ Model  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                     │
│  ┌──────────┐ ┌──────────┐                         │
│  │  Vote    │ │ Victory  │                         │
│  │ Model    │ │ Model    │                         │
│  └──────────┘ └──────────┘                         │
└────────────────────┬─────────────────────────────┘
                     │
┌───────────────────▼─────────────────────────────┐
│                 コアレイヤー                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Common   │ │  Event   │ │  Error   │          │
│  │          │ │ System   │ │ System   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────┘

           ┌─────────────────────────────┐
           │     将来追加予定モジュール     │
           │  ┌──────────┐ ┌───────────┐ │
           │  │  State   │ │Visibility │ │
           │  │ Manager  │ │ Manager   │ │
           │  └──────────┘ └───────────┘ │
           └─────────────────────────────┘
```
