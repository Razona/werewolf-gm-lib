# 人狼ゲームGM支援ライブラリ 情報可視性管理システム設計書（更新版）

## 1. 概要

本設計書では、人狼ゲームGM支援ライブラリの情報可視性管理システムについて詳細に定義します。人狼ゲームでは、プレイヤーごとに知ることができる情報が異なり、この情報の非対称性がゲームの本質的な要素です。情報可視性管理システムは、各プレイヤーが適切な情報のみを閲覧できるよう制御し、ゲームの公平性と正確性を確保します。

**重要**: 本システムはオプショナル機能として設計されており、デフォルトでは無効化されています。明示的に有効化されない限り、すべての情報が制限なく利用可能となります。

## 2. 設計目標

- **正確性**: 各プレイヤーに対して正確な情報のみを提供
- **一貫性**: 役職やゲーム状態に応じて一貫した情報制御を実現
- **柔軟性**: 様々なゲームルールや役職能力に対応できる設計
- **拡張性**: カスタム役職や特殊ルールによる情報公開規則の追加を容易に
- **安全性**: 情報漏洩が発生しないよう適切なアクセス制御を実施
- **オプショナル**: 必要な場合のみ有効化できる独立したシステム

## 3. 情報可視性の概念

### 3.0 機能の有効化

情報可視性管理システムは**デフォルトでは無効**です。この状態では、すべてのプレイヤーに関するすべての情報がアプリケーション層に提供され、情報のフィルタリングはアプリケーション側の責任となります。

本機能を有効化するには、ゲーム作成時に明示的にオプションを指定する必要があります：

```javascript
// 情報可視性管理を有効化する例
const game = werewolf.createGame({
  options: {
    // その他のオプション...
    visibilityControl: {
      enabled: true,        // 情報可視性管理を有効化
      strictMode: false,    // 厳格モード（不正なアクセスでエラー）
      defaultPolicy: 'standard' // 標準的な可視性ポリシー
    }
  }
});
```

機能が無効の場合、本設計書で説明する情報フィルタリングメカニズムは適用されず、すべての情報が制限なく返されます。

### 3.1 情報カテゴリ

人狼ゲームにおける情報は以下のカテゴリに分類されます：

1. **公開情報**: すべてのプレイヤーが常に閲覧可能な情報
   - 生存プレイヤーリスト
   - 現在のゲームフェーズ
   - ターン数
   - 処刑結果（対象プレイヤー）

2. **役職基本情報**: 自分自身の役職に関する情報
   - 自分の役職
   - 役職の能力説明
   - 勝利条件

3. **役職特殊情報**: 特定の役職が知り得る特殊な情報
   - 人狼: 他の人狼プレイヤーのリスト
   - 共有者: 他の共有者プレイヤーのリスト
   - 狂人: 自分が人狼陣営であること
   - 背徳者: 妖狐プレイヤーのリスト

4. **アクション結果情報**: プレイヤーの行動結果に関する情報
   - 占い結果
   - 霊媒結果
   - 護衛結果
   - 襲撃結果

5. **ゲーム進行情報**: ゲームの進行に関する情報
   - 投票状況と結果
   - 死亡者情報（死因を含む）
   - フェーズ遷移情報

6. **メタ情報**: ゲーム設定や統計に関する情報
   - ゲーム設定（レギュレーション）
   - 役職構成（配役）
   - 統計情報

### 3.2 情報アクセスレベル

情報へのアクセスレベルを以下のように定義します：

1. **全体公開**: すべてのプレイヤーが閲覧可能
2. **陣営公開**: 同じ陣営のプレイヤーが閲覧可能
3. **役職公開**: 特定の役職を持つプレイヤーのみが閲覧可能
4. **個人公開**: 特定のプレイヤーのみが閲覧可能
5. **GM専用**: GMのみが閲覧可能
6. **非公開**: システム内部でのみ使用され、誰も直接閲覧不可

### 3.3 情報公開のタイミング

情報が公開されるタイミングは以下のように分類されます：

1. **即時公開**: 情報が生成された時点で即座に公開
2. **フェーズ終了時公開**: 特定のフェーズが終了した時点で公開
3. **条件付き公開**: 特定の条件が満たされた時に公開
4. **ターン終了時公開**: ターンが終了した時点で公開
5. **ゲーム終了時公開**: ゲームが終了した時に公開

## 4. 情報アクセス制御システム

### 4.1 VisibilityManager の設計

情報可視性を管理する中心的なコンポーネントとして `VisibilityManager` を設計します：

**主要責務**:
- 情報アクセス権限の管理
- 視点ベースの情報フィルタリング
- 役職に基づく情報アクセス制御
- 死亡状態に基づく情報アクセス制御
- GMモードの特殊アクセス権限

**主要コンポーネント**:
- VisibilityPolicy: 可視性ポリシーの定義
- VisibilityFilter: 情報フィルタリングエンジン
- ViewGenerator: 視点ベースのビュー生成
- AccessControl: アクセス権限管理

**機能の有効/無効状態の管理**:
```javascript
class VisibilityManager {
  constructor(game, options = {}) {
    this.game = game;
    
    // デフォルトでは無効
    this.enabled = options.enabled || false;
    
    // 有効な場合のみ初期化
    if (this.enabled) {
      this.strictMode = options.strictMode || false;
      this.policy = this.createPolicy(options.defaultPolicy || 'standard');
      this.filter = new VisibilityFilter(this.policy);
      this.viewGenerator = new ViewGenerator(this.game, this.filter);
    }
  }
  
  // 機能が有効かどうかをチェック
  isEnabled() {
    return this.enabled;
  }
  
  // 機能の有効/無効を切り替え
  setEnabled(enabled) {
    if (this.enabled === enabled) return; // 変更なし
    
    this.enabled = enabled;
    
    // 有効化する場合は必要なコンポーネントを初期化
    if (enabled && !this.policy) {
      this.policy = this.createPolicy('standard');
      this.filter = new VisibilityFilter(this.policy);
      this.viewGenerator = new ViewGenerator(this.game, this.filter);
    }
    
    // 状態変更イベント発火
    this.game.eventSystem.emit('visibility.enabled.change', {
      enabled: this.enabled
    });
  }
  
  // 視点情報の取得
  getViewForPlayer(playerId) {
    // 機能が無効の場合は制限なしの完全情報を返す
    if (!this.enabled) {
      return this.getUnfilteredView(playerId);
    }
    
    // 有効な場合はフィルタリングされた情報を返す
    return this.viewGenerator.generateView(playerId);
  }
  
  // フィルタリングしない完全な情報
  getUnfilteredView(playerId) {
    // すべての情報を含む完全なビューを返す
    // フィルタリングなしでゲーム情報を構築
    return {
      game: this.game.getFullGameState(),
      players: this.game.getAllPlayerInfo(),
      roles: this.game.getAllRoleInfo(),
      actions: this.game.getAllActionInfo(),
      votes: this.game.getAllVoteInfo(),
      // その他の完全情報...
    };
  }
  
  // その他のメソッド...
}
```

### 4.2 情報可視性ポリシー

ゲーム全体の情報可視性を制御するポリシー設定を定義します。**デフォルトでは、機能が無効の場合、これらのポリシーは適用されません**。

```
{
  // 死亡プレイヤーの情報アクセス設定
  deadPlayers: {
    canSeeAllRoles: false,       // 全役職情報の閲覧可否
    canSeeWerewolves: false,     // 人狼プレイヤーの閲覧可否
    canSeeFortunes: false,       // 占い結果の閲覧可否
    canSeePrivateChannels: false // プライベートチャットの閲覧可否
  },
  
  // 役職公開設定
  roleReveal: {
    onDeath: true,            // 死亡時に役職公開するか
    onGameEnd: true,          // ゲーム終了時に全役職公開するか
    showTeam: true,           // 陣営情報を公開するか
    showSpecialStatus: false  // 特殊状態を公開するか
  },
  
  // 投票情報の公開設定
  voteVisibility: {
    showVoterNames: true,     // 投票者名を表示するか
    showVoteCount: true,      // 得票数を表示するか
    showRealTimeVotes: false, // リアルタイムで投票状況を表示するか
    anonymousUntilEnd: false  // 投票終了まで匿名表示するか
  },
  
  // アクション結果の公開設定
  actionResultVisibility: {
    showFortuneResults: false,     // 占い結果を全体に公開するか
    showGuardResults: false,       // 護衛結果を全体に公開するか
    showAttackTargets: false,      // 襲撃対象を公開するか
    revealRolesOnSpecialActions: false // 特殊アクション時に役職公開するか
  },
  
  // GMモード設定
  gmMode: {
    enabled: true,            // GMモードを有効にするか
    showAllInformation: true, // すべての情報をGMに表示するか
    logAllEvents: true        // すべてのイベントをログに記録するか
  }
}
```

### 4.3 機能の有効化と無効化

情報可視性管理機能は、次の方法で有効化・無効化できます：

#### 4.3.1 ゲーム作成時の有効化

```javascript
// ゲーム作成時に明示的に有効化
const game = werewolf.createGame({
  options: {
    visibilityControl: {
      enabled: true,  // 情報可視性管理を有効化
      strictMode: false,
      defaultPolicy: 'standard'
    }
  }
});
```

#### 4.3.2 実行時の有効化/無効化

```javascript
// 実行時に有効化
game.setVisibilityControl({
  enabled: true,
  strictMode: false
});

// 実行時に無効化
game.setVisibilityControl({
  enabled: false
});
```

#### 4.3.3 機能の状態確認

```javascript
// 機能が有効かどうかを確認
const isEnabled = game.isVisibilityControlEnabled();
```

#### 4.3.4 ポリシーの更新（機能が有効な場合のみ）

```javascript
// 可視性ポリシーの更新（機能が有効な場合のみ）
game.updateVisibilityPolicy({
  roleReveal: {
    onDeath: false // 死亡時に役職を公開しない
  }
});
```

### 4.4 視点ベースの情報提供

各プレイヤーの視点に応じた情報フィルタリングの仕組みを設計します：

**視点の種類**:
1. **プレイヤー視点**: 特定のプレイヤーから見える情報
2. **GM視点**: すべての情報にアクセス可能
3. **観戦者視点**: 設定に応じた情報のみアクセス可能
4. **録画視点**: 過去の時点での特定視点の情報

**視点ベース情報取得メソッド**:
- `getViewForPlayer(playerId)`: プレイヤー視点の情報
- `getGMView()`: GM視点のすべての情報
- `getSpectatorView()`: 観戦者向けの制限された情報
- `getHistoricalView(playerId, timestamp)`: 過去の時点での視点情報

**情報可視性機能が無効の場合の動作**:
```javascript
// 機能が無効の場合、すべてのビュー取得メソッドは
// フィルタリングなしの完全情報を返します

getViewForPlayer(playerId) {
  if (!this.enabled) {
    return this.getFullGameView(); // 完全情報を返す
  }
  
  // 通常の視点フィルタリング処理...
}

getGMView() {
  // GM視点は機能の有効/無効に関わらず常に完全情報
  return this.getFullGameView();
}

// 完全情報ビューの取得
getFullGameView() {
  return {
    // ゲーム状態の完全な情報
    // フィルタリングなし
  };
}
```

## 5. 役職ごとの情報可視性ルール

**注意**: 以下のルールは、情報可視性管理機能が**有効な場合のみ**適用されます。機能が無効の場合、すべての情報が制限なく利用可能です。

### 5.1 村人陣営の標準的な情報可視性

**村人**:
- 自分の役職情報
- 公開情報
- 公開された投票/処刑結果

**占い師**:
- 村人の情報可視性
- 占いアクションの結果（対象プレイヤーの占い結果）
- 過去の占い履歴

**霊媒師**:
- 村人の情報可視性
- 霊媒アクションの結果（処刑されたプレイヤーの霊媒結果）
- 過去の霊媒履歴

**騎士**:
- 村人の情報可視性
- 護衛アクションの結果（対象が襲撃されたかどうか）
- 過去の護衛履歴

**共有者**:
- 村人の情報可視性
- 他の共有者のプレイヤーID/名前
- 共有者同士の認識情報

### 5.2 人狼陣営の情報可視性

**人狼**:
- 自分の役職情報
- 公開情報
- 他の人狼プレイヤーのID/名前
- 襲撃対象と結果
- 他の人狼による投票情報（襲撃先投票）

**狂人**:
- 自分の役職情報と陣営情報
- 公開情報
- 人狼プレイヤーのID/名前は知らない

### 5.3 第三陣営の情報可視性

**妖狐**:
- 自分の役職情報
- 公開情報
- 特殊な耐性情報（襲撃耐性、占い死）

**背徳者**:
- 自分の役職情報
- 公開情報
- 妖狐プレイヤーのID/名前

### 5.4 死亡プレイヤーの情報可視性

死亡したプレイヤーの情報可視性は、設定によって以下のパターンが考えられます：

1. **制限モード**: 生存時と同じ情報のみ見える
2. **部分開示モード**: 特定の追加情報（人狼リストなど）が見えるようになる
3. **全開示モード**: すべての役職情報と結果が見えるようになる

## 6. フェーズごとの情報可視性変化

**注意**: 以下の情報可視性の変化は、機能が**有効な場合のみ**適用されます。機能が無効の場合、すべての情報が各フェーズで完全に公開されます。

### 6.1 準備フェーズ

- プレイヤー自身の役職が開示される
- 特殊役職（人狼、共有者など）は関連プレイヤー情報が開示される
- 全プレイヤーリストが公開される

### 6.2 夜フェーズ

- 各役職の能力使用可能な対象が表示される
- 生存プレイヤーリストが表示される
- アクション結果が関連プレイヤーに通知される

### 6.3 昼フェーズ

- 夜の結果（死亡者など）が公開される
- 生存プレイヤーリストが更新される
- 設定に応じて死亡者の役職が公開される

### 6.4 投票フェーズ

- 投票対象リストが表示される
- 設定に応じてリアルタイム投票状況が表示される
- 投票結果が公開される

### 6.5 決選投票フェーズ

- 決選投票の対象者が公開される
- 投票状況と結果が設定に応じて表示される

### 6.6 ゲーム終了フェーズ

- 勝利陣営が公開される
- 設定に応じて全プレイヤーの役職が公開される
- ゲーム統計情報が公開される

## 7. イベントシステムとの連携

### 7.1 情報公開関連イベント

情報可視性管理システムは、有効な場合に以下のイベントを発火します：

- `info.role.reveal`: 役職情報が公開された
- `info.result.reveal`: アクション結果が公開された
- `info.vote.reveal`: 投票情報が公開された
- `info.death.reveal`: 死亡情報が公開された
- `info.visibility.change`: 可視性設定が変更された
- `visibility.enabled.change`: 可視性管理機能の有効/無効が変更された

### 7.2 購読するイベント

情報可視性管理システムは、有効な場合に以下のイベントを購読します：

- `player.death`: プレイヤー死亡時の情報公開処理
- `phase.change`: フェーズ変更時の情報公開設定変更
- `role.action.result`: 役職アクション結果の情報公開処理
- `vote.result`: 投票結果の情報公開処理
- `game.end`: ゲーム終了時の情報公開処理

### 7.3 情報フィルタリングプロセス

イベント発生時の情報フィルタリングの流れ：

1. イベント発生（例: `role.action.result`）
2. 情報可視性マネージャーがイベントを購読（機能が有効な場合のみ）
3. イベントデータから公開対象情報を抽出
4. 可視性ポリシーに基づいて公開範囲を決定
5. 各プレイヤー向けにフィルタリングされた情報を生成
6. 情報公開イベント（`info.result.reveal`など）を発火
7. UI側で該当プレイヤーにのみ情報を表示

**機能が無効の場合**:
- ステップ2〜6がスキップされる
- イベントデータが直接利用可能になる

## 8. 実装ガイドライン

### 8.1 情報可視性機能の有効/無効の確認

情報可視性管理機能の有効/無効を常に確認する習慣をつけることが重要です：

```javascript
// 機能の有効/無効チェックを含めた情報取得パターン
getPlayerInfoForView(playerId, viewerId) {
  const player = this.getPlayer(playerId);
  if (!player) return null;
  
  // 可視性管理が無効または閲覧者が自分自身の場合は完全情報
  if (!this.visibilityManager.isEnabled() || playerId === viewerId) {
    return {
      id: player.id,
      name: player.name,
      role: player.role.name,
      isAlive: player.isAlive,
      team: player.role.team,
      // その他すべての情報...
    };
  }
  
  // 有効な場合は通常のフィルタリング処理
  return this.visibilityManager.getFilteredPlayerInfo(player, viewerId);
}
```

### 8.2 機能状態による条件分岐

情報可視性機能の状態によって動作を分岐させるパターン：

```javascript
// 機能状態による処理分岐
getRoleInfoForPlayer(roleId, viewerId) {
  const role = this.roles.get(roleId);
  
  // 機能が無効なら完全情報を返す
  if (!this.isVisibilityControlEnabled()) {
    return this.getFullRoleInfo(role);
  }
  
  // 機能が有効ならフィルタリング処理
  return this.visibilityManager.getFilteredRoleInfo(role, viewerId);
}
```

### 8.3 他のシステムコンポーネントとの統合

他のシステムコンポーネントとの統合においても、情報可視性機能の状態を常に考慮します：

```javascript
// アクション処理システムとの統合例
getActionResultsForPlayer(playerId) {
  const results = this.actionResultStore.getStoredResults(playerId);
  
  // 機能が無効なら完全な結果を返す
  if (!this.game.isVisibilityControlEnabled()) {
    return results;
  }
  
  // 機能が有効なら視点に基づいたフィルタリング
  return this.game.visibilityManager.filterActionResults(results, playerId);
}
```

## 9. 情報可視性制御API

### 9.1 機能の有効化/無効化API

```javascript
// 情報可視性管理機能の有効化
enableVisibilityControl(options = {})

// 情報可視性管理機能の無効化
disableVisibilityControl()

// 機能が有効かどうかの確認
isVisibilityControlEnabled()

// 機能の設定変更（機能が有効な場合のみ有効）
setVisibilityControlOptions(options)
```

### 9.2 情報可視性ポリシーの設定API

```javascript
// 情報可視性ポリシーの設定（機能が有効な場合のみ有効）
setVisibilityPolicy(policy)

// 特定のカテゴリの可視性設定を更新（機能が有効な場合のみ有効）
updateVisibilitySetting(category, settings)

// GMモードの有効/無効切り替え（機能が有効な場合のみ有効）
enableGMMode(playerId, enabled)

// 死亡プレイヤーの可視性設定（機能が有効な場合のみ有効）
setDeadPlayerVisibility(settings)

// 役職公開設定の更新（機能が有効な場合のみ有効）
setRoleRevealSettings(settings)
```

### 9.3 情報アクセスAPI

```javascript
// プレイヤー視点のゲーム情報取得
getGameViewForPlayer(playerId)

// GM視点のゲーム情報取得
getGMView()

// 特定プレイヤーが見える他プレイヤー情報
getVisiblePlayersForPlayer(playerId)

// 特定プレイヤーが見えるアクション結果
getVisibleActionsForPlayer(playerId)

// 特定プレイヤーが見える投票情報
getVisibleVotesForPlayer(playerId)
```

### 9.4 機能が無効の場合のAPIの挙動

情報可視性管理機能が無効の場合、以下のようにAPIが動作します：

- `getGameViewForPlayer()`: 完全なゲーム情報を返す（フィルタリングなし）
- `getVisiblePlayersForPlayer()`: すべてのプレイヤー情報を完全に返す
- `getVisibleActionsForPlayer()`: すべてのアクション結果を返す
- `getVisibleVotesForPlayer()`: すべての投票情報を返す

情報可視性の設定に関するAPIは、機能が無効の場合は何も効果がなく、警告ログを出力します。

## 10. 視点ベースゲーム状態の構造

### 10.1 プレイヤー視点のゲーム状態（機能有効時）

```javascript
{
  // 基本ゲーム情報（常に表示）
  game: {
    id: "game-123",
    turn: 2,
    phase: "day",
    alivePlayers: 7,
    deadPlayers: 2
  },
  
  // 自分自身の情報（常に完全表示）
  self: {
    id: 3,
    name: "プレイヤー4",
    role: {
      name: "seer",
      displayName: "占い師",
      team: "village",
      description: "夜に一人を占い、人狼かどうかを知ることができる"
    },
    isAlive: true,
    actions: [/* 自分のアクション履歴 */],
    actionResults: [/* 自分のアクション結果 */]
  },
  
  // 他プレイヤー情報（フィルタリングされる）
  players: [
    {
      id: 1,
      name: "プレイヤー1",
      isAlive: true,
      role: null,  // 役職は非表示
      knownInfo: { // 既知の追加情報
        fortuneResult: "human" // 占い結果など
      }
    },
    // 他プレイヤー...
  ],
  
  // 公開されたゲームイベント
  events: [/* フィルタリングされたイベント */],
  
  // 投票情報（設定に応じてフィルタリング）
  votes: {
    current: [/* フィルタリングされた現在の投票状況 */],
    history: [/* フィルタリングされた過去の投票履歴 */]
  },
  
  // 特殊な役職関連情報（役職に応じて含まれる）
  specialInfo: {
    // 例: 人狼なら他の人狼情報
    werewolves: [/* 人狼プレイヤーID */],
    // 例: 共有者なら他の共有者情報
    masons: [/* 共有者プレイヤーID */]
  }
}
```

### 10.2 プレイヤー視点のゲーム状態（機能無効時）

```javascript
{
  // 基本ゲーム情報
  game: {
    id: "game-123",
    turn: 2,
    phase: "day",
    alivePlayers: 7,
    deadPlayers: 2,
    // 追加の詳細情報もすべて含まれる
  },
  
  // 完全な自分情報
  self: {
    // 完全な情報
  },
  
  // 他プレイヤー情報（フィルタリングなし - 完全情報）
  players: [
    {
      id: 1,
      name: "プレイヤー1",
      isAlive: true,
      role: {
        name: "werewolf",
        displayName: "人狼",
        team: "werewolf"
      },
      actions: [/* すべてのアクション履歴 */],
      votes: [/* すべての投票履歴 */]
    },
    // 他すべてのプレイヤーの完全情報...
  ],
  
  // すべてのゲームイベント
  events: [/* すべてのイベント */],
  
  // すべての投票情報
  votes: {
    current: [/* すべての現在の投票 */],
    history: [/* すべての投票履歴 */]
  },
  
  // すべての特殊情報
  specialInfo: {
    // すべての特殊情報が含まれる
  }
}
```

## 11. まとめ

情報可視性管理システムは、人狼ゲームの本質的な要素である情報の非対称性を適切に制御するための中核コンポーネントです。本設計書では以下の要素を定義しました：

1. **オプショナル機能としての位置づけ**: デフォルトでは無効で、明示的に有効化する必要がある
2. **情報カテゴリと可視性レベル**: ゲーム内のさまざまな情報とそのアクセスレベル
3. **役職ごとの情報アクセス**: 各役職が知り得る情報の範囲と制限
4. **フェーズごとの情報変化**: ゲームの進行に応じた情報公開の変化
5. **視点ベースの情報提供**: プレイヤーごとに適切にフィルタリングされた情報の提供
6. **拡張性のある設計**: カスタム役職や特殊ルールに対応する拡張機構

情報可視性管理を使用するかどうかの選択をライブラリ利用者に委ねることで、簡易なGMツール開発では情報制御をアプリケーション側で行う簡潔な実装が可能になると同時に、より高度なゲーム体験を実現したい場合には組み込みの情報可視性管理機能を有効化できる柔軟な設計となっています。
