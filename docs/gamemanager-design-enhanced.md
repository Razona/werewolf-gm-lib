
## 1. 概要

GameManagerは人狼ゲームGM支援ライブラリの中核となるコンポーネントであり、各モジュールを統合して管理する責務を持ちます。ファサードパターンを採用し、ライブラリの利用者に統一されたインターフェースを提供するとともに、内部モジュール間の連携を調整します。

## 2. GameManagerの役割と責務

GameManagerは以下の主要な責務を持ちます：

1. **ライブラリの統合ポイント**
   - 各モジュールの初期化と設定
   - モジュール間の連携調整
   - 依存関係の管理
   - 相互参照の確立と循環参照の防止

2. **公開API提供**
   - ライブラリ利用者向けの一貫したインターフェース
   - 内部実装の詳細を隠蔽
   - バージョン互換性の管理
   - エラー処理と例外のハンドリング

3. **ゲーム進行管理**
   - ゲームのライフサイクル（開始、進行、終了）の制御
   - フェーズ遷移の調整
   - ターン管理
   - アクションとイベントの流れの制御

4. **状態管理**
   - ゲーム全体の状態保持
   - 状態変更の一貫性確保
   - 複数モジュールにまたがる状態変更の調整
   - 状態のスナップショットと復元機能（オプション）

5. **イベント管理**
   - モジュール間の通信調整
   - イベントの伝播制御
   - 外部リスナー登録の窓口
   - イベントの処理順序の保証

## 3. 依存モジュールと関係性

GameManagerは以下のモジュールに依存します：

### 3.1 コアモジュール

- **EventSystem**: イベント駆動アーキテクチャの基盤
  - イベントの登録、発火、購読機能を提供
  - モジュール間の疎結合通信を実現
  - イベント階層とワイルドカードサポート

- **ErrorHandler**: エラー処理と検証の一元管理
  - エラーの検出、分類、報告
  - エラー処理ポリシーの設定
  - 操作の妥当性検証

- **Common/Utils**: 共通ユーティリティ機能
  - 汎用ヘルパー関数
  - 乱数生成と管理
  - バリデーション関数

### 3.2 ドメインモジュール

- **PlayerManager**: プレイヤー情報の管理
  - プレイヤーの追加、削除、更新
  - プレイヤーの状態変更
  - プレイヤーの検索とフィルタリング

- **RoleManager**: 役職定義と能力の管理
  - 役職の登録と設定
  - 役職の配布と割り当て
  - 役職能力の管理

- **PhaseManager**: ゲームフェーズと遷移の管理
  - フェーズの定義と管理
  - フェーズ遷移ルールの適用
  - フェーズ固有の処理実行

- **ActionManager**: 役職アクションの管理
  - アクションの登録と管理
  - アクション実行順序の制御
  - アクション結果の計算

- **VoteManager**: 投票処理の管理
  - 投票の受付と変更
  - 投票の集計と結果計算
  - 決選投票と処刑処理

- **VictoryManager**: 勝利条件の判定
  - 勝利条件のチェック
  - 勝者の決定
  - ゲーム終了条件の監視

### 3.3 依存関係図

```
                   +----------------+
                   |  GameManager   |
                   +-------+--------+
                           |
           +---------------+---------------+
           |               |               |
+----------v----+   +------v------+  +-----v--------+
| EventSystem   |   | ErrorHandler|  | Common/Utils |
+---------------+   +-------------+  +--------------+
           |               |               |
+----------v----+   +------v------+  +-----v--------+
| PlayerManager |   | RoleManager |  | PhaseManager |
+---------------+   +-------------+  +--------------+
           |               |               |
+----------v----+   +------v------+  +-----v--------+
| ActionManager |   | VoteManager |  | VictoryManager|
+---------------+   +-------------+  +--------------+
```

### 3.4 依存関係管理戦略

- **単一方向の依存**: 下層モジュールは上層モジュールに依存しない
- **依存性注入**: コンストラクタでの明示的な依存関係の注入
- **イベントベース連携**: 直接参照を避け、イベントを介した通信
- **相互参照の最小化**: 必要最小限の相互参照設定
- **循環参照検出**: 開発時の循環参照検出メカニズム

## 4. クラス設計

### 4.1 プロパティ

GameManagerクラスは以下の主要なプロパティを持ちます：

- **コアシステム**
  - `eventSystem`: イベント管理システム
  - `errorHandler`: エラー処理システム
  - `random`: 乱数生成器（シード指定可能）

- **マネージャー**
  - `playerManager`: プレイヤー管理
  - `roleManager`: 役職管理
  - `phaseManager`: フェーズ管理
  - `actionManager`: アクション管理
  - `voteManager`: 投票管理
  - `victoryManager`: 勝利判定

- **ゲーム状態**
  - `state`: 現在のゲーム状態を保持するオブジェクト
    ```javascript
    {
      id: "game-123",           // ゲーム一意識別子
      isStarted: false,         // ゲーム開始状態
      isEnded: false,           // ゲーム終了状態
      winner: null,             // 勝者（陣営）
      winningPlayers: [],       // 勝利プレイヤー
      turn: 0,                  // 現在のターン
      phase: null,              // 現在のフェーズ
      players: [],              // プレイヤー情報の参照（詳細はPlayerManagerが管理）
      roles: {},                // 役職設定（詳細はRoleManagerが管理）
      votes: [],                // 投票状況（詳細はVoteManagerが管理）
      actions: [],              // アクション履歴（詳細はActionManagerが管理）
      history: [],              // ターン履歴
      lastUpdate: null,         // 最終更新タイムスタンプ
      lastDeath: null           // 最後の死亡情報
    }
    ```

- **設定**
  - `options`: ゲームの設定オプション
    ```javascript
    {
      randomSeed: null,         // 乱数シード値
      regulations: {            // レギュレーション設定
        allowConsecutiveGuard: false,  // 連続ガード可否
        allowRoleMissing: false,       // 役職欠け可否
        firstDayExecution: false,      // 初日処刑可否
        revealRoleOnDeath: true,       // 死亡時役職公開
        // その他のレギュレーション...
      },
      visibilityControl: {      // 情報可視性設定（オプション）
        enabled: false,         // 可視性制御の有効化
        strictMode: false       // 厳格モード
      },
      debugMode: false,         // デバッグモード
      strictMode: false,        // 厳格モード（エラー処理）
      apiVersion: "1.0.0"       // API互換性バージョン
    }
    ```

### 4.2 メソッド構成

GameManagerのメソッドは以下のカテゴリに分類されます：

#### 4.2.1 初期化・設定関連

- **`constructor(options)`**: GameManagerインスタンスの初期化
- **`initialize()`**: 初期設定の完了
- **`setRegulations(regulations)`**: ゲームレギュレーションの設定
- **`setup()`**: 各モジュールの設定と初期化
- **`setupEventListeners()`**: 内部イベントリスナーの設定
- **`setupCrossReferences()`**: マネージャー間の相互参照設定
- **`validateOptions(options)`**: オプションの検証

#### 4.2.2 プレイヤー管理関連

- **`addPlayer(name)`**: プレイヤーの追加
- **`removePlayer(id)`**: プレイヤーの削除
- **`getPlayer(id)`**: プレイヤー情報の取得
- **`getAlivePlayers()`**: 生存プレイヤーの取得
- **`getAllPlayers()`**: 全プレイヤーの取得
- **`killPlayer(playerId, cause)`**: プレイヤーの死亡処理

#### 4.2.3 役職管理関連

- **`setRoles(roleList)`**: 役職リストの設定
- **`distributeRoles()`**: 役職の配布
- **`assignRole(playerId, roleName)`**: 特定の役職を割り当て
- **`getRoleInfo(playerId)`**: 役職情報の取得

#### 4.2.4 ゲーム進行関連

- **`start()`**: ゲームの開始
- **`nextPhase()`**: 次のフェーズへの移行
- **`getCurrentPhase()`**: 現在のフェーズの取得
- **`vote(voterId, targetId)`**: 投票処理
- **`registerAction(action)`**: アクションの登録
- **`executeVote()`**: 投票結果の実行
- **`checkWinCondition()`**: 勝利条件のチェック
- **`endGame(result)`**: ゲームの終了処理

#### 4.2.5 状態管理関連

- **`getCurrentState()`**: 現在のゲーム状態の取得
- **`getGameSummary()`**: ゲームの概要取得
- **`isGameStarted()`**: ゲームが開始されているか
- **`isGameEnded()`**: ゲームが終了しているか
- **`getWinner()`**: 勝者の取得
- **`updateState(partialState)`**: 状態の部分的更新
- **`createStateSnapshot()`**: 状態のスナップショット作成（トランザクション用）
- **`restoreStateSnapshot(snapshot)`**: 状態のスナップショット復元

#### 4.2.6 イベント関連

- **`on(eventName, callback)`**: イベントリスナーの登録
- **`off(eventName, callback)`**: イベントリスナーの削除
- **`once(eventName, callback)`**: 一度だけ実行されるリスナーの登録
- **`emit(eventName, data)`**: イベントの発火

#### 4.2.7 エラー処理関連

- **`validateOperation(operation, context)`**: 操作の妥当性検証
- **`handleError(error, context)`**: エラー処理
- **`setErrorPolicy(policy)`**: エラー処理ポリシーの設定

## 5. メソッド詳細設計

### 5.1 初期化・設定関連

#### constructor(options)

**目的**: GameManagerインスタンスを初期化し、必要なモジュールを設定する

**入力**:
- `options`: ゲーム設定オプション (オブジェクト)
  - `randomSeed`: 乱数シード (数値、オプション)
  - `regulations`: レギュレーション設定 (オブジェクト、オプション)
  - `visibilityControl`: 情報可視性設定 (オブジェクト、オプション)
  - `debugMode`: デバッグモード (真偽値、デフォルト:false)
  - `strictMode`: 厳格モード (真偽値、デフォルト:false)
  - `apiVersion`: 互換性バージョン (文字列、オプション)

**処理**:
1. オプションの検証（無効なオプションの検出）
2. デフォルトオプションとのマージ
3. コアシステム（EventSystem, ErrorHandler）の初期化
4. 乱数生成器の初期化（シード指定の場合は決定的乱数、そうでなければMath.random）
5. 各マネージャーの初期化と依存性注入
6. レギュレーション設定の適用（指定されている場合）
7. 初期設定の完了

**出力**:
- GameManagerインスタンス

**エラーケース**:
- 無効なオプション形式: オプションが期待される形式でない場合
- 互換性バージョン不一致: apiVersionが現在のバージョンと互換性がない場合
- 初期化失敗: いずれかのモジュール初期化に失敗した場合

**検証条件**:
- `regulations`が指定される場合はオブジェクトであること
- `randomSeed`が指定される場合は数値であること
- `apiVersion`が指定される場合は互換性チェックを行う

#### setRegulations(regulations)

**目的**: ゲームのレギュレーション設定を各マネージャーに適用する

**入力**:
- `regulations`: レギュレーション設定 (オブジェクト)
  - `allowConsecutiveGuard`: 連続ガード可否 (真偽値)
  - `allowRoleMissing`: 役職欠け可否 (真偽値)
  - `firstDayExecution`: 初日処刑可否 (真偽値)
  - `executionRule`: 同数得票時の処理方法 ('runoff'|'random'|'no_execution'|'all_execution')
  - `revealRoleOnDeath`: 死亡時役職公開 (真偽値)
  - その他のレギュレーション設定...

**処理**:
1. レギュレーション設定の妥当性検証
2. 各マネージャーにレギュレーション設定を伝播
   - PhaseManagerにフェーズ関連のレギュレーション設定
   - RoleManagerに役職関連のレギュレーション設定
   - ActionManagerにアクション関連のレギュレーション設定
   - VoteManagerに投票関連のレギュレーション設定
3. レギュレーション設定イベントの発火
4. オプション設定の更新

**出力**:
- 設定が成功したかどうか (真偽値)

**エラーケース**:
- 無効なレギュレーション: サポートされていない設定値
- ゲーム進行中のレギュレーション変更: 一部の設定はゲーム開始後に変更不可
- 矛盾するレギュレーション: 互いに競合する設定の組み合わせ

**検証条件**:
- レギュレーションはプレイヤー数や役職設定と整合性が取れていること
- 列挙型の設定値は許可されたセットから選択されていること

#### setupCrossReferences()

**目的**: マネージャー間の相互参照を設定する

**処理**:
1. PhaseManagerに他のマネージャーへの参照を設定
   - PlayerManagerへの参照設定: `phaseManager.setPlayerManager(playerManager)`
   - VoteManagerへの参照設定: `phaseManager.setVoteManager(voteManager)`
   - ActionManagerへの参照設定: `phaseManager.setActionManager(actionManager)`

2. VoteManagerに必要な参照を設定
   - PlayerManagerへの参照設定: `voteManager.setPlayerManager(playerManager)`

3. ActionManagerに必要な参照を設定
   - PlayerManagerへの参照設定: `actionManager.setPlayerManager(playerManager)`
   - RoleManagerへの参照設定: `actionManager.setRoleManager(roleManager)`

4. VictoryManagerに必要な参照を設定
   - PlayerManagerへの参照設定: `victoryManager.setPlayerManager(playerManager)`
   - RoleManagerへの参照設定: `victoryManager.setRoleManager(roleManager)`

5. 循環参照がないことを検証（開発時）

**エラーケース**:
- 循環参照: マネージャー間で循環参照が発生した場合
- 未初期化マネージャー: いずれかのマネージャーが正しく初期化されていない場合

**注意点**:
- 相互参照は最小限に抑え、可能な限りイベントベースの連携を優先する
- 循環参照が発生しないよう慎重に設計する

#### setupEventListeners()

**目的**: 内部イベントリスナーを設定し、モジュール間の連携を確立する

**処理**:
1. 勝利条件関連のイベントリスナー設定
   ```
   this.eventSystem.on('victory.condition.met', (data) => {
     this.endGame({
       winner: data.team,
       reason: data.reason,
       winningPlayers: data.winningPlayers
     });
   });
   ```

2. プレイヤー死亡イベントのリスナー設定
   ```
   this.eventSystem.on('player.death', (data) => {
     // 状態更新と勝利条件チェック
     this.updateState({
       lastDeath: {
         playerId: data.playerId,
         cause: data.cause,
         turn: this.state.turn
       }
     });

     // 死亡プレイヤーの役職公開（設定による）
     if (this.options.regulations.revealRoleOnDeath) {
       // 役職公開処理
     }

     // 勝利条件チェック
     this.checkWinCondition();
   });
   ```

3. フェーズ変更イベントのリスナー設定
   ```
   this.eventSystem.on('phase.change', (data) => {
     // 状態更新
     this.updateState({
       phase: data.newPhase,
       turn: data.turn
     });
   });
   ```

4. ターン関連イベントのリスナー設定
   ```
   this.eventSystem.on('turn.end', (data) => {
     // ターン終了時の状態更新とサマリー作成
     const turnSummary = this.createTurnSummary(data.turn);
     this.updateState({
       history: [...this.state.history, turnSummary]
     });
   });
   ```

5. エラーイベントのリスナー設定
   ```
   this.eventSystem.on('error', (data) => {
     // エラーログと通知
     if (this.options.debugMode) {
       console.error(`Error: ${data.code} - ${data.message}`);
     }
   });
   ```

**エラーケース**:
- イベント衝突: 同じイベントに対して矛盾する処理が登録された場合
- イベントループ: イベントが無限ループに陥る場合

**注意点**:
- メモリリークを防ぐため、ゲーム終了時に適切にリスナーをクリーンアップする
- 高頻度イベントにはデバウンスやスロットリングを検討する

### 5.2 プレイヤー管理関連

#### addPlayer(name)

**目的**: 新しいプレイヤーをゲームに追加する

**入力**:
- `name`: プレイヤー名 (文字列)

**処理**:
1. ゲーム状態の検証
   ```
   if (this.isGameStarted()) {
     throw this.errorHandler.createError('GAME_ALREADY_STARTED', 'ゲームは既に開始されています');
   }

   // 必要な設定が完了しているか確認
   const players = this.getAllPlayers();
   if (players.length < 3) { // 最小プレイヤー数
     throw this.errorHandler.createError('INSUFFICIENT_PLAYERS', 'ゲームを開始するには最低3人のプレイヤーが必要です');
   }

   if (!this.state.roles?.distributed) {
     throw this.errorHandler.createError('ROLES_NOT_DISTRIBUTED', '役職が配布されていません');
   }
   ```

2. ゲーム状態を開始状態に更新
   ```
   this.updateState({
     isStarted: true,
     turn: 1,
     startTime: Date.now()
   });
   ```

3. ゲーム開始前イベントの発火
   ```
   this.eventSystem.emit('game.starting', {
     players: players.length,
     roles: this.state.roles.list
   });
   ```

4. PhaseManagerに初期フェーズへの移行を指示
   ```
   const initialPhase = this.phaseManager.moveToInitialPhase();
   ```

5. ゲーム開始イベントの発火
   ```
   this.eventSystem.emit('game.started', {
     players: this.getAllPlayers().map(p => ({ id: p.id, name: p.name })),
     initialPhase: initialPhase.id,
     turn: 1,
     timestamp: Date.now()
   });
   ```

**出力**:
- 開始が成功したかどうか (真偽値)

**エラーケース**:
- ゲーム既開始: 既にゲームが開始されている
- プレイヤー不足: 最小必要人数（通常3人）未満
- 役職未配布: 役職がプレイヤーに配布されていない
- 初期フェーズエラー: 初期フェーズへの移行に失敗

**注意点**:
- ゲーム開始は一度しか実行できない
- 開始前に必要な全ての準備が整っていることを確認する
- 開始直後は通常「準備フェーズ」または「初日夜フェーズ」に移行する

#### nextPhase()

**目的**: 次のゲームフェーズに移行する

**処理**:
1. ゲーム状態の検証
   ```
   if (!this.isGameStarted()) {
     throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
   }

   if (this.isGameEnded()) {
     throw this.errorHandler.createError('GAME_ALREADY_ENDED', 'ゲームは既に終了しています');
   }
   ```

2. PhaseManagerに次フェーズへの移行を委譲
   ```
   const nextPhaseInfo = this.phaseManager.moveToNextPhase();
   ```

3. ターン管理（必要に応じて）
   ```
   if (nextPhaseInfo.newTurn) {
     // ターンカウントの増加
     this.updateState({
       turn: this.state.turn + 1
     });

     // ターン開始イベントの発火
     this.eventSystem.emit('turn.start', {
       turn: this.state.turn,
       phase: nextPhaseInfo.id
     });
   }
   ```

4. 状態の更新
   ```
   this.updateState({
     phase: nextPhaseInfo.id,
     phaseStartTime: Date.now()
   });
   ```

5. 勝利条件のチェック（フェーズ終了時）
   ```
   // 前のフェーズが終了した時点で勝利条件をチェック
   if (nextPhaseInfo.previousPhase) {
     this.checkWinCondition();
   }
   ```

**出力**:
- 移行先のフェーズ情報 (オブジェクト)
  ```javascript
  {
    id: "night",           // フェーズID
    displayName: "夜フェーズ", // 表示名
    turn: 2,               // 現在のターン
    isNewTurn: false       // 新しいターンかどうか
  }
  ```

**エラーケース**:
- ゲーム未開始: ゲームが開始されていない場合
- ゲーム終了: ゲームが既に終了している場合
- 遷移不可: 現在のフェーズから次のフェーズへの遷移が許可されていない場合
- 前提条件未達成: 次のフェーズへの移行に必要な条件が満たされていない場合

**注意点**:
- 一部のフェーズ遷移では特定の条件（全員の投票完了など）が必要
- フェーズ遷移時に様々なゲームロジックが実行される場合がある
- 新しいターンの開始判定は通常PhaseManagerが提供する

#### vote(voterId, targetId)

**目的**: プレイヤーの投票を登録する

**入力**:
- `voterId`: 投票者のプレイヤーID (数値)
- `targetId`: 投票対象のプレイヤーID (数値)

**処理**:
1. ゲーム状態の検証
   ```
   if (!this.isGameStarted()) {
     throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
   }

   if (this.isGameEnded()) {
     throw this.errorHandler.createError('GAME_ALREADY_ENDED', 'ゲームは既に終了しています');
   }

   const currentPhase = this.getCurrentPhase();
   if (currentPhase.id !== 'vote' && currentPhase.id !== 'runoffVote') {
     throw this.errorHandler.createError('INVALID_PHASE', '現在は投票フェーズではありません');
   }
   ```

2. 投票者と投票対象の検証
   ```
   const voter = this.getPlayer(voterId);
   if (!voter || !voter.isAlive) {
     throw this.errorHandler.createError('INVALID_VOTER', '無効な投票者です');
   }

   const target = this.getPlayer(targetId);
   if (!target) {
     throw this.errorHandler.createError('INVALID_TARGET', '無効な投票対象です');
   }

   // 自己投票の検証（設定による）
   if (voterId === targetId && !this.options.regulations.allowSelfVote) {
     throw this.errorHandler.createError('SELF_VOTE_FORBIDDEN', '自分自身への投票は許可されていません');
   }
   ```

3. VoteManagerに投票登録を委譲
   ```
   const result = this.voteManager.registerVote(voterId, targetId);
   ```

4. 投票完了チェック（すべての生存プレイヤーが投票済みか）
   ```
   const voteStatus = this.voteManager.getVoteStatus();
   if (voteStatus.complete) {
     // 全員投票完了イベント発火
     this.eventSystem.emit('vote.all_complete', {
       phase: currentPhase.id,
       votes: voteStatus.votes
     });
   }
   ```

**出力**:
- 投票結果 (オブジェクト)
  ```javascript
  {
    success: true,       // 投票成功
    voterId: 1,          // 投票者ID
    targetId: 3,         // 対象ID
    changed: false,      // 投票変更かどうか
    previousTarget: null // 前回の投票対象（変更時のみ）
  }
  ```

**エラーケース**:
- ゲーム未開始/終了: ゲームが開始されていないまたは終了している
- 不正なフェーズ: 投票フェーズでない
- 無効な投票者: 存在しないまたは死亡しているプレイヤー
- 無効な投票対象: 存在しないプレイヤーまたは投票不可の対象
- 自己投票禁止: 自己投票が許可されていない設定の場合

**検証条件**:
- 現在のフェーズが投票フェーズまたは決選投票フェーズであること
- 投票者が生存しているプレイヤーであること
- 投票対象が有効なプレイヤーであること
- レギュレーションによっては自己投票可否のチェック

#### registerAction(action)

**目的**: プレイヤーのアクション（役職能力の使用など）を登録する

**入力**:
- `action`: アクション情報 (オブジェクト)
  ```javascript
  {
    type: "fortune",     // アクション種別
    actor: 1,            // 実行者ID
    target: 3,           // 対象ID
    night: 2,            // 実行ターン（夜）
    options: {}          // 追加オプション（任意）
  }
  ```

**処理**:
1. ゲーム状態の検証
   ```
   if (!this.isGameStarted()) {
     throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
   }

   if (this.isGameEnded()) {
     throw this.errorHandler.createError('GAME_ALREADY_ENDED', 'ゲームは既に終了しています');
   }

   const currentPhase = this.getCurrentPhase();
   if (currentPhase.id !== 'night') {
     throw this.errorHandler.createError('INVALID_PHASE', 'アクション登録は夜フェーズでのみ可能です');
   }
   ```

2. アクションの基本検証
   ```
   if (!action || !action.type || typeof action.actor !== 'number') {
     throw this.errorHandler.createError('INVALID_ACTION', '無効なアクションフォーマットです');
   }
   ```

3. アクター（実行者）の検証
   ```
   const actor = this.getPlayer(action.actor);
   if (!actor || !actor.isAlive) {
     throw this.errorHandler.createError('INVALID_ACTOR', '無効なアクション実行者です');
   }
   ```

4. 役職能力の使用可能性検証
   ```
   const canUseAbility = this.roleManager.canUseAbility(
     actor.id,
     action.type,
     { night: this.state.turn }
   );

   if (!canUseAbility.allowed) {
     throw this.errorHandler.createError('ABILITY_USE_FORBIDDEN', canUseAbility.reason);
   }
   ```

5. ActionManagerにアクション登録を委譲
   ```
   const result = this.actionManager.registerAction(action);
   ```

6. アクション登録イベントの発火
   ```
   this.eventSystem.emit('action.registered', {
     actionId: result.actionId,
     type: action.type,
     actor: action.actor,
     // 一部情報は公開しない
   });
   ```

7. アクション完了チェック（対象役職の全アクションが登録済みか）
   ```
   const actionStatus = this.actionManager.getActionStatus();
   if (actionStatus.complete) {
     // 全アクション完了イベント発火
     this.eventSystem.emit('action.all_complete', {
       night: this.state.turn
     });
   }
   ```

**出力**:
- アクション登録結果 (オブジェクト)
  ```javascript
  {
    success: true,    // 登録成功
    actionId: "act-1234", // アクションID
    replaced: false,  // 既存アクションの置き換えかどうか
  }
  ```

**エラーケース**:
- ゲーム未開始/終了: ゲームが開始されていないまたは終了している
- 不正なフェーズ: 夜フェーズでない
- 無効なアクター: 存在しないまたは死亡しているプレイヤー
- 能力使用不可: 役職が該当能力を持たない、または使用条件を満たさない
- 対象不正: アクションの対象が不正（護衛の連続対象など）

**検証条件**:
- 現在のフェーズが夜フェーズであること
- アクション実行者が生存しているプレイヤーであること
- 実行者が該当アクションを実行できる役職であること
- アクションの種類に応じた追加条件（対象の妥当性など）

### 5.5 状態管理関連

#### getCurrentState()

**目的**: 現在のゲーム状態の全体を取得する

**処理**:
1. 各マネージャーから最新の状態情報を集約
   ```
   const players = this.playerManager.getAllPlayers();
   const phase = this.phaseManager.getCurrentPhase();
   const votes = this.isGameStarted() ? this.voteManager.getCurrentVotes() : [];
   const actions = this.isGameStarted() ? this.actionManager.getPastActions() : [];
   ```

2. 情報可視性の適用（設定が有効な場合）
   ```
   // 情報可視性制御が有効かどうかをチェック
   if (this.options.visibilityControl?.enabled) {
     // 公開情報のみ返す処理
     // ...
   }
   ```

3. ゲーム全体の状態を構築
   ```
   const state = {
     id: this.state.id,
     isStarted: this.state.isStarted,
     isEnded: this.state.isEnded,
     turn: this.state.turn,
     phase: phase ? phase.id : null,
     players: players,
     winner: this.state.winner,
     winningPlayers: this.state.winningPlayers,
     startTime: this.state.startTime,
     endTime: this.state.endTime,
     lastUpdate: Date.now()
   };
   ```

**出力**:
- ゲーム状態を表すオブジェクト
  ```javascript
  {
    id: "game-123",
    isStarted: true,
    isEnded: false,
    turn: 2,
    phase: "night",
    players: [...],  // プレイヤー情報の配列
    roles: {...},    // 役職情報（設定による）
    votes: [...],    // 投票情報（設定による）
    actions: [...],  // アクション履歴（設定による）
    winner: null,    // まだ勝者なし
    winningPlayers: [],
    history: [...],  // ターン履歴
    startTime: 1621234567890,
    endTime: null,
    lastUpdate: 1621234599999
  }
  ```

**エラーケース**:
- 内部状態不整合: 各マネージャーの状態が一貫していない場合

**注意点**:
- 情報可視性設定が有効な場合、返される情報は制限される可能性がある
- 返される状態オブジェクトは深いコピーであり、内部状態への参照ではない
- パフォーマンスのため、呼び出し頻度の高い場合はキャッシュを検討

#### updateState(partialState)

**目的**: ゲーム状態を部分的に更新する

**入力**:
- `partialState`: 更新する部分的な状態 (オブジェクト)
  ```javascript
  {
    phase: "day",    // 更新するフィールド
    turn: 3,         // 更新するフィールド
    // ...
  }
  ```

**処理**:
1. 状態更新前イベントの発火
   ```
   this.eventSystem.emit('state.update.before', {
     currentState: { ...this.state },
     updates: partialState
   });
   ```

2. 状態の部分的更新
   ```
   // 単純なフィールドの更新
   const newState = {
     ...this.state,
     ...partialState,
     lastUpdate: Date.now()
   };

   // 配列やオブジェクトフィールドの特殊処理
   if (partialState.players) {
     // 配列の場合は置き換えではなくマージが必要な場合も
     newState.players = this._mergePlayersState(this.state.players, partialState.players);
   }

   // その他の特殊フィールドに対する処理
   // ...

   // 状態の更新
   this.state = newState;
   ```

3. 状態更新後イベントの発火
   ```
   this.eventSystem.emit('state.update.after', {
     previousState: { ...this.state, ...partialState },
     currentState: this.state,
     updates: partialState
   });
   ```

**出力**:
- 更新された状態 (オブジェクト)

**エラーケース**:
- 不正なフィールド更新: 更新不可のフィールドが含まれる
- 型不一致: 既存フィールドと異なる型の値で更新を試みる
- 状態不整合: 更新によって状態の整合性が崩れる

**注意点**:
- 直接変更せず、新しいオブジェクトを作成して置き換える（イミュータブルアプローチ）
- 複雑なネストしたオブジェクトの更新には注意が必要
- 履歴に残すべき重要な状態変更は履歴エントリも作成

#### checkWinCondition()

**目的**: 現在の状態で勝利条件が満たされているかチェックする

**処理**:
1. ゲーム状態の検証
   ```
   if (!this.isGameStarted()) {
     return null; // ゲーム未開始の場合は勝利条件なし
   }

   if (this.isGameEnded()) {
     return this.state.winner ? {
       winner: this.state.winner,
       reason: this.state.winReason,
       players: this.state.winningPlayers
     } : null;
   }
   ```

2. VictoryManagerに勝利条件チェックを委譲
   ```
   const victoryResult = this.victoryManager.checkVictoryConditions();
   ```

3. 勝利条件が満たされている場合の処理
   ```
   if (victoryResult && victoryResult.satisfied) {
     // ゲーム終了処理
     this.endGame({
       winner: victoryResult.winningTeam,
       reason: victoryResult.reason,
       winningPlayers: victoryResult.winningPlayers
     });

     return {
       winner: victoryResult.winningTeam,
       reason: victoryResult.reason,
       players: victoryResult.winningPlayers
     };
   }
   ```

**出力**:
- 勝利条件の結果 (オブジェクトまたはnull)
  ```javascript
  {
    winner: "village",          // 勝利陣営
    reason: "人狼が全滅した",    // 勝利理由
    players: [0, 1, 2]          // 勝利プレイヤーID
  }
  ```

**エラーケース**:
- 内部エラー: VictoryManagerでのチェック処理に失敗した場合

**注意点**:
- ゲーム終了時に自動的に`endGame`を呼び出すため、別途呼び出す必要はない
- 村人陣営、人狼陣営、第三陣営など、複数の勝利条件が同時に満たされる場合は優先度が考慮される
- 呼び出し頻度の高いメソッドなので、パフォーマンスに注意

### 5.6 イベント関連

#### on(eventName, callback)

**目的**: イベントリスナーを登録する

**入力**:
- `eventName`: 購読するイベント名 (文字列)
  - 標準イベント形式: `category.action` (例: `player.death`)
  - ワイルドカード形式: `category.*` (カテゴリ内すべてのイベント)
  - 汎用形式: `*` (すべてのイベント)
- `callback`: イベント発火時に実行するコールバック関数
  - 形式: `function(data) { ... }`

**処理**:
1. コールバックの検証
   ```
   if (typeof callback !== 'function') {
     throw new Error('イベントリスナーはコールバック関数である必要があります');
   }
   ```

2. イベント名の正規化と検証
   ```
   const normalizedEventName = this._normalizeEventName(eventName);
   if (!normalizedEventName) {
     throw new Error('無効なイベント名です');
   }
   ```

3. EventSystemにリスナー登録を委譲
   ```
   return this.eventSystem.on(normalizedEventName, callback);
   ```

**出力**:
- リスナー登録の識別子または成功状態 (実装依存)

**エラーケース**:
- 無効なイベント名: サポートされていないイベント名フォーマット
- 無効なコールバック: コールバックが関数でない
- イベントリミット: リスナーが多すぎる場合（実装依存）

**注意点**:
- イベントリスナーはメモリリークの原因となる可能性があるため、不要になったら解除する
- 同一のコールバックを複数回登録可能だが、解除時に問題となる場合がある
- パフォーマンスのため、`*`などの広範なイベント購読は控えめに使用する

## 6. イベントフロー

GameManagerを中心としたイベントフローの主要なシーケンスを定義します。

### 6.1 ゲーム開始シーケンス

1. クライアントが `game.start()` を呼び出す
2. GameManagerが前提条件を検証（プレイヤー数、役職配布など）
3. 内部状態を更新して、`game.starting` イベントを発火
   ```
   eventData = {
     players: [プレイヤー数],
     roles: [役職リスト]
   }
   ```
4. PhaseManagerが初期フェーズ（通常は「準備フェーズ」）を設定
5. `phase.start.preparation` イベントが発火
   ```
   eventData = {
     phase: "preparation",
     turn: 1
   }
   ```
6. `game.started` イベントが発火
   ```
   eventData = {
     players: [プレイヤー基本情報の配列],
     initialPhase: "preparation",
     turn: 1,
     timestamp: [タイムスタンプ]
   }
   ```

### 6.2 フェーズ遷移シーケンス

1. クライアントが `game.nextPhase()` を呼び出す
2. GameManagerが状態を検証（ゲーム開始済み、未終了など）
3. PhaseManagerが現在のフェーズ終了処理を実行
4. `phase.end.[currentPhase]` イベントが発火
   ```
   eventData = {
     phase: "[現在のフェーズ]",
     turn: [現在のターン],
     duration: [フェーズ継続時間]
   }
   ```
5. PhaseManagerが次のフェーズを決定し、開始処理を実行
6. 新しいターンの場合は `turn.start` イベントを発火
   ```
   eventData = {
     turn: [新しいターン番号],
     phase: "[新しいフェーズ]"
   }
   ```
7. `phase.start.[nextPhase]` イベントが発火
   ```
   eventData = {
     phase: "[次のフェーズ]",
     turn: [現在または新しいターン],
     isNewTurn: [新しいターンかどうか]
   }
   ```
8. GameManagerが状態を更新
9. 特定フェーズでは勝利条件のチェックを実行

### 6.3 投票処理シーケンス

1. クライアントが各プレイヤーの `game.vote(voterId, targetId)` を呼び出す
2. 各投票がVoteManagerに登録され、`vote.registered` イベントが発火
   ```
   eventData = {
     voter: [投票者ID],
     target: [対象ID],
     phase: "[現在のフェーズ]"
   }
   ```
3. すべての投票が完了すると `vote.all_complete` イベントが発火
   ```
   eventData = {
     phase: "[現在のフェーズ]",
     votes: [投票情報の配列]
   }
   ```
4. クライアントが `game.executeVote()` を呼び出す（または自動実行）
5. VoteManagerが投票を集計し、`vote.counted` イベントが発火
   ```
   eventData = {
     counts: {[対象ID]: [得票数], ...},
     maxVoted: [最多得票者IDの配列],
     isTie: [同数かどうか]
   }
   ```
6. 処刑対象が決定され、`execution.target` イベントが発火
   ```
   eventData = {
     targetId: [処刑対象ID],
     votes: [得票数]
   }
   ```
7. 処刑が実行され、対象プレイヤーが死亡状態に変更
8. `player.death` イベントが発火（処刑された場合）
   ```
   eventData = {
     playerId: [死亡プレイヤーID],
     cause: "execution",
     executedBy: "vote",
     turn: [現在のターン]
   }
   ```
9. 勝利条件のチェックが実行される

### 6.4 ゲーム終了シーケンス

1. 勝利条件が満たされると `victory.condition.met` イベントが発火
   ```
   eventData = {
     team: [勝利陣営],
     reason: [勝利理由],
     winningPlayers: [勝利プレイヤーIDの配列]
   }
   ```
2. GameManagerの `endGame` メソッドが呼ばれる
3. ゲーム状態が更新され、勝者情報が記録される
4. `game.ending` イベントが発火
   ```
   eventData = {
     winner: [勝利陣営],
     reason: [勝利理由],
     players: [勝利プレイヤーIDの配列],
     turn: [終了ターン]
   }
   ```
5. 終了処理（役職公開など）が実行される
6. `game.ended` イベントが発火
   ```
   eventData = {
     winner: [勝利陣営],
     reason: [勝利理由],
     players: [勝利プレイヤーIDの配列],
     statistics: [ゲーム統計情報],
     duration: [ゲーム継続時間]
   }
   ```
7. 最終的なゲーム結果がクライアントに返される

## 7. エラー処理戦略

GameManagerは以下のエラー処理戦略を採用します：

### 7.1 エラー分類とコード体系

| エラーカテゴリ | コード範囲 | 例 |
|--------------|----------|------|
| 初期化エラー | E001-E099 | `E001: INVALID_OPTIONS` |
| プレイヤーエラー | E100-E199 | `E101: PLAYER_NOT_FOUND` |
| 役職エラー | E200-E299 | `E201: INVALID_ROLE` |
| フェーズエラー | E300-E399 | `E301: INVALID_PHASE_TRANSITION` |
| アクションエラー | E400-E499 | `E401: INVALID_ACTION` |
| 投票エラー | E検証（開始済みの場合はエラー）
   ```
   if (this.isGameStarted()) {
     throw this.errorHandler.createError('GAME_ALREADY_STARTED', 'ゲーム開始後にプレイヤーを追加できません');
   }
   ```

2. 入力の検証
   ```
   if (!name || typeof name !== 'string') {
     throw this.errorHandler.createError('INVALID_PLAYER_NAME', 'プレイヤー名は空でない文字列である必要があります');
   }
   ```

3. PlayerManagerにプレイヤー追加を委譲
   ```
   const playerId = this.playerManager.addPlayer(name);
   ```

4. プレイヤー追加イベントの発火
   ```
   this.eventSystem.emit('player.added', {
     playerId,
     name
   });
   ```

5. 状態の更新
   ```
   this.updateState({
     players: this.playerManager.getAllPlayers()
   });
   ```

**出力**:
- 追加されたプレイヤーのID (数値)

**エラーケース**:
- ゲーム開始後の追加: ゲームが既に開始されている場合
- 無効なプレイヤー名: 名前が空または文字列でない場合
- 重複プレイヤー名: 同じ名前のプレイヤーが既に存在する場合（設定による）
- プレイヤー数超過: 最大プレイヤー数を超える場合

**検証条件**:
- ゲームが開始されていないこと
- プレイヤー名が有効な文字列であること
- 設定によっては重複名のチェック

#### getAlivePlayers()

**目的**: 生存しているプレイヤーのリストを取得する

**処理**:
1. PlayerManagerに処理を委譲
   ```
   return this.playerManager.getAlivePlayers();
   ```

**出力**:
- 生存プレイヤーオブジェクトの配列
  ```javascript
  [
    { id: 0, name: "プレイヤー1", role: "villager", isAlive: true, ... },
    { id: 1, name: "プレイヤー2", role: "werewolf", isAlive: true, ... },
    // ...
  ]
  ```

**エラーケース**:
- 未初期化: PlayerManagerが初期化されていない場合

**注意点**:
- 情報可視性設定が有効な場合、権限に応じてフィルタリングが必要
- 返されるオブジェクトの構造は深いコピーか参照かを明確にする

### 5.3 役職管理関連

#### setRoles(roleList)

**目的**: ゲームで使用する役職リストを設定する

**入力**:
- `roleList`: 役職名の配列 (文字列配列)
  例: `['villager', 'villager', 'werewolf', 'seer']`

**処理**:
1. ゲーム状態の検証（開始済みの場合はエラー）
   ```
   if (this.isGameStarted()) {
     throw this.errorHandler.createError('GAME_ALREADY_STARTED', 'ゲーム開始後に役職リストを変更できません');
   }
   ```

2. 入力の検証
   ```
   if (!Array.isArray(roleList) || roleList.length === 0) {
     throw this.errorHandler.createError('INVALID_ROLE_LIST', '役職リストは空でない配列である必要があります');
   }
   ```

3. RoleManagerに役職リスト設定を委譲
   ```
   const result = this.roleManager.setRoles(roleList);
   ```

4. 役職設定イベントの発火
   ```
   this.eventSystem.emit('roles.set', {
     roles: roleList
   });
   ```

5. 状態の更新
   ```
   this.updateState({
     roles: {
       list: roleList,
       distributed: false
     }
   });
   ```

**出力**:
- 設定が成功したかどうか (真偽値)

**エラーケース**:
- ゲーム開始後の変更: ゲームが既に開始されている場合
- 無効な役職リスト: リストが配列でないか空の場合
- 未知の役職: サポートされていない役職名が含まれる場合
- 役職依存性エラー: 役職間の必要な依存関係を満たさない場合（例: 背徳者には妖狐が必要）

**検証条件**:
- ゲームが開始されていないこと
- すべての役職名が有効であること
- 役職間の依存関係が満たされていること
- プレイヤー数と役職数の一致（または役職欠け設定）

#### distributeRoles()

**目的**: 設定された役職をプレイヤーに配布する

**処理**:
1. ゲーム状態の検証
   ```
   if (this.isGameStarted()) {
     throw this.errorHandler.createError('GAME_ALREADY_STARTED', 'ゲーム開始後に役職を再配布できません');
   }

   if (this.state.roles?.distributed) {
     throw this.errorHandler.createError('ROLES_ALREADY_DISTRIBUTED', '役職は既に配布されています');
   }
   ```

2. プレイヤー数と役職数の検証
   ```
   const players = this.getAllPlayers();
   const roles = this.state.roles?.list || [];

   if (players.length !== roles.length && !this.options.regulations.allowRoleMissing) {
     throw this.errorHandler.createError('PLAYER_ROLE_MISMATCH', 'プレイヤー数と役職数が一致しません');
   }
   ```

3. RoleManagerに役職配布を委譲
   ```
   const distribution = this.roleManager.distributeRoles(
     players.map(p => p.id),
     roles,
     { random: this.random }
   );
   ```

4. 各プレイヤーへの役職割り当て
   ```
   Object.entries(distribution).forEach(([playerId, roleName]) => {
     this.assignRole(parseInt(playerId), roleName);
   });
   ```

5. 役職配布イベントの発火
   ```
   this.eventSystem.emit('roles.distributed', {
     distribution: Object.entries(distribution).map(([playerId, roleName]) => ({
       playerId: parseInt(playerId),
       role: roleName
     }))
   });
   ```

6. 状態の更新
   ```
   this.updateState({
     roles: {
       ...this.state.roles,
       distributed: true,
       distribution
     }
   });
   ```

**出力**:
- 配布結果オブジェクト（プレイヤーIDと役職名のマッピング）
  ```javascript
  {
    0: "villager",
    1: "werewolf",
    2: "seer",
    // ...
  }
  ```

**エラーケース**:
- ゲーム開始後の再配布: ゲームが既に開始されている場合
- 役職未設定: 役職リストが設定されていない場合
- プレイヤー数不一致: プレイヤー数と役職数が一致せず、役職欠けが許可されていない場合
- 役職依存性エラー: 配布後に役職間の依存関係が満たされない場合

**注意点**:
- 乱数生成器（`this.random`）を使用して決定的または非決定的な配布が可能
- 役職欠け設定が有効な場合、プレイヤー数＜役職数の場合は一部の役職が使用されない

### 5.4 ゲーム進行関連

#### start()

**目的**: ゲームを開始し、初期フェーズに移行する

**処理**:
1. ゲーム状態の







| 投票エラー | E500-E599 | `E501: INVALID_VOTER` |
| 状態エラー | E600-E699 | `E601: INVALID_STATE_TRANSITION` |
| システムエラー | E900-E999 | `E901: INTERNAL_ERROR` |

### 7.2 エラー処理レベル

1. **致命的エラー (Fatal)**: システムの継続が不可能
   - 例: 内部状態の重大な不整合、メモリ不足
   - 処理: ゲームを停止し、状態を保存して回復手段を提供

2. **エラー (Error)**: 操作が完了できない重大な問題
   - 例: 無効なプレイヤーID、不正なフェーズ遷移
   - 処理: 例外をスローし、操作を中止

3. **警告 (Warning)**: 問題はあるが、操作は継続可能
   - 例: 推奨されない操作、将来的に廃止予定のAPI
   - 処理: ログに記録し、イベントを発火するが処理は継続

4. **情報 (Info)**: 情報提供のみ
   - 例: デバッグ情報、状態変更の通知
   - 処理: ログに記録するのみ

### 7.3 エラー検出と予防

- **バリデーション**: 各操作の前に入力パラメータを検証
  ```javascript
  validateOperation(operation, context) {
    // 操作の種類に応じた検証
    switch(operation) {
      case 'addPlayer':
        if (!context.name || typeof context.name !== 'string') {
          return {
            valid: false,
            code: 'E101',
            message: 'プレイヤー名は空でない文字列である必要があります'
          };
        }
        // その他の検証...
        break;
      // 他の操作タイプ...
    }

    return { valid: true };
  }
  ```

- **状態検証**: 操作が現在の状態で許可されるか検証
  ```javascript
  validateGameState(operation) {
    // ゲーム開始済みかどうか
    if (['addPlayer', 'removePlayer', 'setRoles'].includes(operation) && this.isGameStarted()) {
      return {
        valid: false,
        code: 'E601',
        message: 'ゲーム開始後はこの操作を実行できません'
      };
    }

    // その他の状態検証...

    return { valid: true };
  }
  ```

- **整合性チェック**: 内部状態の一貫性を定期的に検証
  ```javascript
  checkConsistency() {
    // プレイヤー数と役職数の整合性
    if (this.state.roles?.distributed) {
      const playerCount = this.playerManager.getAllPlayers().length;
      const roleAssignments = Object.keys(this.state.roles.distribution).length;

      if (playerCount !== roleAssignments) {
        // 不整合を検出
        return {
          consistent: false,
          code: 'E602',
          message: 'プレイヤー数と役職割り当て数が一致しません'
        };
      }
    }

    // その他の整合性チェック...

    return { consistent: true };
  }
  ```

### 7.4 エラー処理の実装

```javascript
handleError(error, context = {}) {
  // エラーオブジェクトの標準化
  const standardError = this.errorHandler.standardizeError(error, context);

  // エラーレベルに応じた処理
  switch(standardError.level) {
    case 'fatal':
      // 状態の保存を試行
      this.saveEmergencyState();

      // 致命的エラーイベントの発火
      this.eventSystem.emit('error.fatal', {
        error: standardError,
        context
      });

      // エラースロー
      throw standardError;

    case 'error':
      // エラーイベントの発火
      this.eventSystem.emit('error', {
        error: standardError,
        context
      });

      // エラースロー
      throw standardError;

    case 'warning':
      // 警告イベントの発火
      this.eventSystem.emit('warning', {
        warning: standardError,
        context
      });

      // 警告ログ
      console.warn(`Warning: ${standardError.code} - ${standardError.message}`);
      break;

    case 'info':
      // 情報ログ
      if (this.options.debugMode) {
        console.info(`Info: ${standardError.message}`);
      }
      break;
  }

  return standardError;
}
```

### 7.5 エラーリカバリー機構

- **状態スナップショット**: 重要な操作前に状態のスナップショットを作成
  ```javascript
  createStateSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  restoreStateSnapshot(snapshot) {
    this.state = JSON.parse(JSON.stringify(snapshot));
    this.eventSystem.emit('state.restored', {
      state: this.state
    });
  }
  ```

- **トランザクション的処理**: 複雑な状態変更をトランザクション的に扱う
  ```javascript
  beginTransaction() {
    this.transactionSnapshot = this.createStateSnapshot();
    this.inTransaction = true;
  }

  commitTransaction() {
    this.transactionSnapshot = null;
    this.inTransaction = false;
  }

  rollbackTransaction() {
    if (this.transactionSnapshot) {
      this.restoreStateSnapshot(this.transactionSnapshot);
      this.transactionSnapshot = null;
      this.inTransaction = false;
      return true;
    }
    return false;
  }
  ```

- **エラー後の状態検証**: エラー発生後に状態の一貫性を検証
  ```javascript
  verifyStateAfterError() {
    const consistency = this.checkConsistency();
    if (!consistency.consistent) {
      // 一貫性が失われている場合は回復を試みる
      this.attemptStateRecovery(consistency);
    }
  }
  ```

## 8. 拡張性設計

GameManagerは将来の拡張を見据えた設計を持ちます：

### 8.1 プラグインアーキテクチャ

```javascript
// プラグイン定義インターフェイス
interface Plugin {
  id: string;                 // プラグイン識別子
  name: string;               // 表示名
  version: string;            // バージョン
  dependencies?: string[];    // 依存プラグイン
  initialize: Function;       // 初期化関数
  cleanup?: Function;         // クリーンアップ関数
  handlers?: Object;          // イベントハンドラ
}

// プラグイン管理機能
class PluginManager {
  plugins = new Map();

  // プラグインの登録
  registerPlugin(plugin) {
    // 検証
    if (!plugin.id || !plugin.initialize) {
      throw new Error('Invalid plugin format');
    }

    // 重複チェック
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`);
    }

    // 依存関係チェック
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Missing dependency: ${depId}`);
        }
      }
    }

    // 登録
    this.plugins.set(plugin.id, {
      ...plugin,
      enabled: false
    });

    return true;
  }

  // プラグインの有効化
  enablePlugin(pluginId, options = {}) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.enabled) {
      return false; // 既に有効
    }

    // 依存関係を先に有効化
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        this.enablePlugin(depId);
      }
    }

    // 初期化
    plugin.instance = plugin.initialize(this.game, options);

    // イベントハンドラの登録
    if (plugin.handlers) {
      for (const [event, handler] of Object.entries(plugin.handlers)) {
        this.game.on(event, handler);
      }
    }

    plugin.enabled = true;
    return true;
  }

  // プラグインの無効化
  disablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) {
      return false;
    }

    // 依存プラグインを先にチェック
    for (const [id, p] of this.plugins.entries()) {
      if (p.enabled && p.dependencies && p.dependencies.includes(pluginId)) {
        throw new Error(`Cannot disable plugin ${pluginId}: it is required by ${id}`);
      }
    }

    // クリーンアップ
    if (plugin.cleanup) {
      plugin.cleanup(this.game);
    }

    // イベントハンドラの削除
    if (plugin.handlers) {
      for (const [event, handler] of Object.entries(plugin.handlers)) {
        this.game.off(event, handler);
      }
    }

    plugin.enabled = false;
    plugin.instance = null;
    return true;
  }
}
```

#### プラグイン例: カスタム役職追加

```javascript
// カスタム役職プラグイン例
const customRolePlugin = {
  id: "custom_roles",
  name: "カスタム役職パック",
  version: "1.0.0",

  // 初期化
  initialize: (game, options) => {
    // カスタム役職の登録
    game.roleManager.registerRole({
      id: "bomber",
      name: "爆弾魔",
      team: "neutral",
      // 役職定義
    });

    // プラグインデータの初期化
    return {
      registeredRoles: ["bomber"]
    };
  },

  // クリーンアップ
  cleanup: (game) => {
    // 登録した役職の削除
  },

  // イベントハンドラ
  handlers: {
    "player.death": (data) => {
      // 特殊な死亡処理など
    }
  }
};
```

### 8.2 イベントフック

拡張ポイントとして以下のイベントフックを提供します：

1. **ライフサイクルフック**:
   - `game.before_start`: ゲーム開始前
   - `game.after_start`: ゲーム開始後
   - `game.before_end`: ゲーム終了前
   - `game.after_end`: ゲーム終了後

2. **フェーズフック**:
   - `phase.before_change`: フェーズ変更前
   - `phase.after_change`: フェーズ変更後
   - `phase.before_[phase_name]`: 特定フェーズ開始前
   - `phase.after_[phase_name]`: 特定フェーズ終了後

3. **アクションフック**:
   - `action.before_register`: アクション登録前
   - `action.after_register`: アクション登録後
   - `action.before_execute`: アクション実行前
   - `action.after_execute`: アクション実行後

4. **投票フック**:
   - `vote.before_register`: 投票登録前
   - `vote.after_register`: 投票登録後
   - `vote.before_count`: 投票集計前
   - `vote.after_count`: 投票集計後

5. **勝利条件フック**:
   - `victory.before_check`: 勝利条件チェック前
   - `victory.after_check`: 勝利条件チェック後

これらのイベントフックにリスナーを登録することで、既存の処理を変更したり拡張したりできます。

### 8.3 カスタマイズ可能な設定

設定のカスタマイズを容易にするフレームワーク：

```javascript
// 設定定義
const configDefinitions = {
  regulations: {
    allowConsecutiveGuard: {
      type: 'boolean',
      default: false,
      description: '連続ガードの可否'
    },
    firstDayExecution: {
      type: 'boolean',
      default: false,
      description: '初日処刑の可否'
    },
    // 他の設定...
  },

  // カスタム設定グループも追加可能
  customGroup: {
    // ...
  }
};

// 設定処理機能
class ConfigManager {
  config = {};
  definitions = configDefinitions;

  constructor(initialConfig = {}) {
    // デフォルト値の適用
    this.resetToDefaults();

    // 初期設定の適用
    this.updateConfig(initialConfig);
  }

  // デフォルトにリセット
  resetToDefaults() {
    this.config = {};

    // 全ての設定グループを処理
    for (const [groupKey, group] of Object.entries(this.definitions)) {
      this.config[groupKey] = {};

      // グループ内の各設定項目を処理
      for (const [key, def] of Object.entries(group)) {
        this.config[groupKey][key] = def.default;
      }
    }
  }

  // 設定更新
  updateConfig(newConfig) {
    // 各設定グループを処理
    for (const [groupKey, group] of Object.entries(newConfig)) {
      if (!this.definitions[groupKey]) {
        // 未知の設定グループは処理しない（またはカスタム設定として処理）
        continue;
      }

      // グループ初期化
      this.config[groupKey] = this.config[groupKey] || {};

      // グループ内の各設定を処理
      for (const [key, value] of Object.entries(group)) {
        const definition = this.definitions[groupKey][key];

        if (!definition) {
          // 未知の設定キーは処理しない
          continue;
        }

        // 型チェック
        if (typeof value !== definition.type) {
          // 型変換またはスキップ
          continue;
        }

        // 設定適用
        this.config[groupKey][key] = value;
      }
    }
  }

  // 設定の取得
  getConfig(group, key) {
    if (key === undefined) {
      // グループ全体を取得
      return this.config[group] ? { ...this.config[group] } : undefined;
    }

    // 特定の設定を取得
    return this.config[group] ? this.config[group][key] : undefined;
  }

  // カスタム設定グループの登録
  registerConfigGroup(groupKey, definitions) {
    if (this.definitions[groupKey]) {
      throw new Error(`Config group ${groupKey} already exists`);
    }

    this.definitions[groupKey] = definitions;
    this.config[groupKey] = {};

    // デフォルト値の適用
    for (const [key, def] of Object.entries(definitions)) {
      this.config[groupKey][key] = def.default;
    }
  }
}
```

これにより、プラグインやカスタム拡張が独自の設定グループを追加できるようになります。

## 9. パフォーマンスと最適化

GameManagerの性能を確保するための設計考慮事項：

### 9.1 メモリ使用量の最適化

- **参照の最小化**: 深いコピーと参照の適切な使い分け
  ```javascript
  // 深いコピーが必要な場合
  const stateCopy = JSON.parse(JSON.stringify(this.state));

  // 参照で十分な場合
  const players = this.playerManager.getAlivePlayers();
  ```

- **履歴データの効率的な管理**: 履歴データの増大を制御
  ```javascript
  // 履歴圧縮
  compressHistory() {
    // 一定期間経過したターンの詳細履歴を要約情報のみに圧縮
    const oldTurns = this.state.history.filter(h => h.turn < this.state.turn - 5);

    for (const turn of oldTurns) {
      // 詳細データを要約に置き換え
      turn.details = null;
      turn.summary = this.generateTurnSummary(turn);
    }
  }
  ```

- **不要なオブジェクト参照の解放**: 不要になったオブジェクトの参照を解放
  ```javascript
  // ゲーム終了時のクリーンアップ
  cleanup() {
    // 大きなデータ構造の参照解放
    this.tempData = null;

    // 不要なイベントリスナーの解放
    this.cleanupEventListeners();
  }
  ```

### 9.2 イベント処理の最適化

- **高頻度イベントのバッチ処理**: 頻繁に発生するイベントをバッチで処理
  ```javascript
  // バッチ処理ヘルパー
  setupBatchedEventHandler(eventName, batchSize, timeWindow, handler) {
    let batch = [];
    let timeoutId = null;

    const processBatch = () => {
      if (batch.length > 0) {
        handler(batch);
        batch = [];
      }
      timeoutId = null;
    };

    // イベントリスナー
    this.on(eventName, (data) => {
      batch.push(data);

      // バッチサイズに達したら即時処理
      if (batch.length >= batchSize) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        processBatch();
      }
      // タイムアウト設定
      else if (!timeoutId) {
        timeoutId = setTimeout(processBatch, timeWindow);
      }
    });
  }
  ```

- **イベントリスナーの適切な登録解除**: メモリリークを防ぐため、不要になったリスナーを解除
  ```javascript
  // リスナークリーンアップ
  cleanupEventListeners() {
    // 一時的なリスナーの解除
    for (const [eventName, callback] of this.temporaryListeners) {
      this.eventSystem.off(eventName, callback);
    }
    this.temporaryListeners = [];
  }
  ```

- **重複イベント抑制**: 短時間に同じイベントが連続して発火されるのを防止
  ```javascript
  // デバウンス処理
  debounce(func, wait) {
    let timeout;

    return function(...args) {
      const later = () => {
        timeout = null;
        func.apply(this, args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 使用例
  this.debouncedStateUpdate = this.debounce(this.updateState, 100);
  ```

### 9.3 状態更新の効率化

- **部分的な状態更新**: 必要な部分のみを更新
  ```javascript
  // 効率的な状態更新
  updateState(partialState) {
    // 変更がない場合は処理しない
    if (Object.keys(partialState).length === 0) {
      return this.state;
    }

    const newState = { ...this.state };

    // 各フィールドに対する最適な更新処理
    for (const [key, value] of Object.entries(partialState)) {
      if (key === 'players') {
        // プレイヤー配列は特別扱い
        newState.players = this.mergePlayersState(newState.players, value);
      } else {
        // その他のフィールドは単純に上書き
        newState[key] = value;
      }
    }

    newState.lastUpdate = Date.now();
    this.state = newState;

    return this.state;
  }

  // プレイヤー状態の効率的なマージ
  mergePlayersState(currentPlayers, updates) {
    // 更新するプレイヤーのIDをマップ化
    const updateMap = new Map();
    updates.forEach(p => updateMap.set(p.id, p));

    // 既存プレイヤーの更新
    return currentPlayers.map(player => {
      const update = updateMap.get(player.id);
      if (update) {
        // 該当プレイヤーの更新
        updateMap.delete(player.id); // 処理済みマーク
        return { ...player, ...update };
      }
      return player; // 更新なし
    }).concat(
      // 未処理の新規プレイヤー追加
      Array.from(updateMap.values())
    );
  }
  ```

- **差分更新**: 変更部分のみを送信/保存
  ```javascript
  // 状態の差分取得
  getStateDiff(oldState, newState) {
    const diff = {};

    // 基本フィールドの差分
    for (const key of Object.keys(newState)) {
      if (key === 'players' || key === 'roles') {
        // 複雑なオブジェクトは別処理
        continue;
      }

      if (oldState[key] !== newState[key]) {
        diff[key] = newState[key];
      }
    }

    // プレイヤー差分
    if (oldState.players && newState.players) {
      diff.players = this.getPlayersDiff(oldState.players, newState.players);
    }

    return diff;
  }
  ```

- **複数モジュールにまたがる状態変更の最適化**: トランザクション的なアプローチ
  ```javascript
  // 複合操作の最適化
  async performComplexOperation() {
    // 状態変更をバッファリング
    this.beginStateChanges();

    try {
      // 操作1
      await this.operation1();

      // 操作2
      await this.operation2();

      // 操作3
      await this.operation3();

      // まとめて状態更新
      this.flushStateChanges();

      return { success: true };
    } catch (error) {
      // エラー時は変更を破棄
      this.discardStateChanges();
      throw error;
    }
  }
  ```

## 10. テスト戦略

GameManagerをテストするための具体的な戦略：

### 10.1 単体テスト戦略

各メソッドの入出力と境界条件をテストします：

```javascript
// GameManager単体テスト例
describe('GameManager', () => {
  let gameManager;

  beforeEach(() => {
    // テスト用インスタンスの作成
    gameManager = new GameManager({
      randomSeed: 12345 // 再現性のため固定シード
    });
  });

  describe('addPlayer', () => {
    it('should add a player successfully', () => {
      const playerId = gameManager.addPlayer('TestPlayer');
      expect(playerId).toBeDefined();
      expect(gameManager.getPlayer(playerId).name).toBe('TestPlayer');
    });

    it('should reject adding a player after game start', () => {
      // ゲーム開始
      gameManager.addPlayer('Player1');
      gameManager.addPlayer('Player2');
      gameManager.addPlayer('Player3');
      gameManager.setRoles(['villager', 'werewolf', 'seer']);
      gameManager.distributeRoles();
      gameManager.start();

      // 開始後のプレイヤー追加
      expect(() => {
        gameManager.addPlayer('LatePlayer');
      }).toThrow(/ゲーム開始後/);
    });

    it('should handle invalid player names', () => {
      expect(() => gameManager.addPlayer('')).toThrow(/無効なプレイヤー名/);
      expect(() => gameManager.addPlayer(null)).toThrow(/無効なプレイヤー名/);
      expect(() => gameManager.addPlayer(123)).toThrow(/無効なプレイヤー名/);
    });
  });

  // 他のメソッドのテスト...
});
```

特に以下の境界条件をテストします：

1. **入力範囲境界**: 無効な入力値や極端な値
2. **状態境界**: ゲーム開始前/後、フェーズ境界
3. **エラー条件**: エラーが適切に検出され処理されるか
4. **順序依存**: メソッド呼び出し順序による結果の違い

### 10.2 統合テスト戦略

複数モジュールの連携が正しく機能するかをテストします：

```javascript
// 統合テスト例: PlayerManagerとRoleManagerの連携
describe('GameManager Integration', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager({
      randomSeed: 12345
    });
  });

  describe('Role distribution', () => {
    it('should correctly distribute roles to players', () => {
      // プレイヤー追加
      const playerIds = [];
      for (let i = 0; i < 5; i++) {
        playerIds.push(gameManager.addPlayer(`Player${i}`));
      }

      // 役職設定と配布
      const roles = ['villager', 'villager', 'werewolf', 'seer', 'medium'];
      gameManager.setRoles(roles);
      const distribution = gameManager.distributeRoles();

      // 検証
      expect(Object.keys(distribution).length).toBe(5);

      // 各プレイヤーの役職取得
      const assignedRoles = playerIds.map(id => gameManager.getRoleInfo(id).name);

      // 役職数の一致を確認
      const roleCounts = countRoles(assignedRoles);
      expect(roleCounts.villager).toBe(2);
      expect(roleCounts.werewolf).toBe(1);
      expect(roleCounts.seer).toBe(1);
      expect(roleCounts.medium).toBe(1);
    });
  });

  // イベント連携テスト
  describe('Event propagation', () => {
    it('should emit appropriate events on player death', (done) => {
      // プレイヤーとゲーム設定
      setupBasicGame(gameManager);

      // イベントリスナー
      gameManager.on('player.death', (data) => {
        expect(data.playerId).toBe(2);
        expect(data.cause).toBe('execution');
        done();
      });

      // プレイヤー死亡処理
      gameManager.killPlayer(2, 'execution');
    });
  });

  // ヘルパー関数
  function countRoles(roles) {
    return roles.reduce((counts, role) => {
      counts[role] = (counts[role] || 0) + 1;
      return counts;
    }, {});
  }

  function setupBasicGame(gm) {
    // 基本的なゲームセットアップ
    // ...
  }
});
```

特に以下の連携をテストします：

1. **PlayerManager+RoleManager**: 役職割り当てと取得
2. **PhaseManager+ActionManager**: フェーズに基づくアクション制御
3. **VoteManager+PlayerManager**: 投票と死亡処理
4. **イベント伝播**: あるモジュールのイベントが他モジュールに伝わるか

### 10.3 シナリオテスト戦略

実際のゲーム進行を模したシナリオをテストします：

```javascript
// シナリオテスト例: 基本的なゲーム進行
describe('GameManager Scenario', () => {
  it('should handle a basic game scenario', async () => {
    const gameManager = new GameManager({
      randomSeed: 12345,
      regulations: {
        firstDayExecution: false // 初日処刑なし
      }
    });

    // 1. ゲームのセットアップ
    // プレイヤー追加
    const playerIds = [];
    for (let i = 0; i < 5; i++) {
      playerIds.push(gameManager.addPlayer(`Player${# GameManager 設計書（改訂版）
