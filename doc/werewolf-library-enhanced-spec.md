

## 1. 目的
人狼ゲーム配信コミュニティのGM向けに、ゲーム進行の核となる処理を提供するJavaScriptライブラリを開発する。このライブラリは様々な形態のGMツール（Discordボット、配信補助ツール、投票管理システムなど）に組み込めるよう、ゲームロジックをモジュール化し、開発者が人狼ゲームの基本処理を再実装する手間を省くことを目的とする。

## 2. 設計原則
- **イベント駆動型アーキテクチャ**: すべての状態変化はイベントとして発火し、外部システムがリッスンできる設計
- **モジュール性**: 必要な機能のみ利用できる構造
- **拡張性**: 基本役職以外のカスタム役職やルールをアドオンとして追加可能
- **ステートレス指向**: サーバーサイドでもクライアントサイドでも利用可能な設計
- **ES6準拠**: 最新のJavaScript標準に準拠
- **開発者体験重視**: 直感的なAPIと明確なエラーメッセージで開発者の生産性を向上

## 3. コア機能

### 3.1 ゲーム管理
- **ゲームインスタンスの作成と設定**
  - プレイヤー数（7～20人対応）、使用役職の設定
  - レギュレーション設定（詳細は3.1.1参照）
- **フェーズ管理**
  - 準備フェーズ
  - 夜フェーズ（複数回の夜フェーズをサポート）
  - 昼フェーズ（議論）
  - 投票フェーズ
  - 決選投票フェーズ
  - 終了フェーズ
- **ターン管理**
  - 現在のターン数の追跡
  - 各ターンの開始/終了イベント発火
  - 日と夜のサイクル管理

#### 3.1.1 レギュレーション設定
- **基本ルール設定**
  - 連続ガードの可否
  - 役職欠けの可否
  - 同票時の処理方法（決選投票、ランダム処刑、処刑なし、全員処刑）
  - 初日処刑の有無
- **占い関連設定**
  - 初日占いの方式（ランダム白、狐以外ランダム結果、自由占い）
  - 占い結果の表示方法（人狼/村人、黒/白など）
- **特殊条件設定**
  - 狼の数に応じた勝利条件調整
  - 引き分け条件の設定

### 3.2 プレイヤー管理
- **プレイヤーの追加/削除**
- **プレイヤープロパティ**
  - プレイヤー名
  - 役職（初期値はnull）
  - 生死状態
  - 内部ID（0から昇順で自動割り当て）
- **プレイヤー状態の変更**
  - 処刑による死亡
  - 襲撃による死亡
  - その他の理由による死亡
  - 状態効果の付与（毒、魅了など）

### 3.3 役職管理
- **基本役職の実装**
  - 村人
  - 人狼
  - 狂人
  - 占い師
  - 霊媒師
  - 騎士
  - 共有者
  - 狐
  - 背徳者
- **役職の依存関係と制約チェック**
  - 必須役職の確認（人狼がいない場合はエラー）
  - 依存役職のチェック（背徳者には狐が必要など）
- **役職自動配布機能**
  - ランダム配布
  - 制約条件付き配布（特定の役職の数を指定など）
  - 役職配布時の依存関係の自動調整
- **カスタム役職の登録システム**
  - 基底クラスを継承した役職の追加
  - 能力効果のカスタマイズ
  - 将来の拡張を見据えた設計（悪女陣営、独裁者、猫又など）
- **陣営管理**
  - 基本陣営（村人陣営、人狼陣営、第三陣営）
  - 拡張陣営の登録システム

### 3.4 アクション処理
- **夜アクション管理**
  - 複数回の夜フェーズ対応
  - 役職ごとのアクションタイミング制御
  - アクション実行可能かの判定（生存者のみ等）
- **標準アクション実装**
  - 占い（各種初日占いルール対応）
  - 護衛（連続ガード制限など各種ルール対応）
  - 襲撃（人狼による集団投票処理）
  - その他役職アクション
- **アクション間の相互作用**
  - 優先順位の処理（例：護衛成功の場合、襲撃失敗）
  - 条件付きアクション効果
  - 連鎖反応の処理（例：猫又の道連れ）
- **アクション結果の計算**
  - 成功/失敗の判定
  - 影響を受けるプレイヤーの状態変更
  - 結果情報の非対称的な通知

### 3.5 投票管理
- **投票の受付**
  - プレイヤーごとの投票先記録
  - 投票変更の処理
- **投票の集計**
  - 得票数の計算
  - 同数時の処理（設定に基づく）
    - 決選投票の実施
    - ランダム処刑
    - 処刑なし
    - 対象者全員処刑
- **決選投票処理**
  - 決選投票対象者の特定
  - 再度の投票集計
  - 決選投票後も同数の場合の処理（レギュレーションに従う）
- **処刑実行処理**
  - 処刑対象の決定
  - 処刑後のイベント発火

### 3.6 勝利判定
- **陣営ごとの勝利条件**
  - 村人陣営
  - 人狼陣営
  - 第三陣営（狐など）
- **勝利状態の監視**
  - ターン終了ごとの勝利条件チェック
  - 特殊勝利条件の判定

### 3.7 イベントシステム
- **コアイベント**
  - ゲーム開始/終了
  - フェーズ開始/終了
  - プレイヤー死亡
  - 役職能力使用
  - 投票開始/終了
  - 勝利条件達成
- **カスタムイベント登録**
  - 独自イベントの定義と発火
  - イベントリスナーの追加/削除

### 3.8 エラー処理システム
- **エラーカタログ**
  - 標準化されたエラーコードと説明メッセージ
  - コンテキスト情報を含む詳細なエラーオブジェクト
  ```javascript
  const ErrorCatalog = {
    INVALID_PLAYER_ACTION: {
      code: 'E001',
      message: 'プレイヤーは現在このアクションを実行できません',
      details: '死亡者や特定の状態効果下ではアクションが制限されます'
    },
    INVALID_PHASE_TRANSITION: {
      code: 'E002',
      message: '現在のフェーズからその遷移は許可されていません',
      details: '特定のフェーズ順序に従う必要があります'
    },
    // 他のエラー定義...
  };
  ```
- **エラーレベルの区分**
  - 致命的エラー（ゲーム継続不可）
  - エラー（操作失敗）
  - 警告（問題あるが処理続行）
  - 情報（通知のみ）
- **診断情報の提供**
  - エラー発生時の詳細なコンテキスト情報
  - ゲーム状態のスナップショット
  - エラーの原因と推奨される解決策
- **エラーハンドリングポリシー設定**
  ```javascript
  game.setErrorPolicy({
    logLevel: 'warning',    // warning以上のレベルをログに記録
    throwLevel: 'error',    // error以上のレベルで例外をスロー
    emitAll: true           // すべてのレベルでイベント発火
  });
  ```

## 4. 拡張機能

### 4.1 アドオンシステム
- **役職アドオン**
  - 新規役職の追加
  - 役職能力のカスタマイズ
- **ルールアドオン**
  - 特殊ルールの実装
  - 進行ルールの変更

### 4.2 表示データ生成
- **現在の状態取得API**
  - 生存プレイヤー一覧
  - 役職情報（公開/非公開）
  - 投票状況
- **ヒストリー取得API**
  - 過去の投票履歴
  - 過去のアクション履歴
  - CO履歴

### 4.3 状態保存・復元システム
- **ゲーム状態のシリアライズ**
  - JSON形式での状態出力
  - デフォルトでは保存機能を無効化
  - アプリケーション側で呼び出した場合のみ実行
- **保存データフォーマット**
  - プレイヤー情報
  - 現在の役職状況
  - ターンとフェーズ情報
  - 履歴データ（オプション）
- **ゲーム状態の復元**
  - 保存データからのゲーム復元
  - 一時中断/再開対応
  - 復元時の整合性検証
- **外部ストレージとの連携**
  - 外部ファイルやDBへの保存はアプリケーション側の責任
  - 適切なインターフェースの提供

### 4.4 情報可視性管理（オプション機能）
- **可視性ポリシー設定**
  - デフォルトではすべて公開（アプリケーション側で判断）
  - 選択的に有効化可能な情報隠蔽機能
- **プレイヤー視点のデータ取得**
  - プレイヤーIDベースの情報フィルタリング
  - `getVisibleDataForPlayer(playerId)` などのヘルパーメソッド
- **GM視点のデータ取得**
  - すべての情報にアクセスできるGM用ビュー
- **役職ベースの情報制御**
  - 役職に応じた情報開示設定
  - 共有者同士の認識機能など

### 4.5 開発支援ツール
- **状態可視化システム**
  - 現在のゲーム状態をJSON形式で出力
  - 前回の状態との差分出力
  ```javascript
  // 状態ダンプの例
  const stateDump = game.dumpState();
  const diff = game.dumpStateDiff(previousState);
  ```

- **ビジュアルデバッガー**
  - 生存プレイヤー、役職分布、投票状況のグラフィカル表示
  - イベント履歴のタイムライン表示
  - 将来的なWebベースのビジュアライザーのためのデータエクスポート機能

- **シナリオランナー**
  - 事前定義されたゲームシナリオの実行
  - テストケースとしての利用
  ```javascript
  // シナリオ実行の例
  werewolf.runScenario({
    name: '狐勝利シナリオ',
    players: 7,
    roles: ['villager', 'villager', 'villager', 'werewolf', 'werewolf', 'seer', 'fox'],
    actions: [
      { type: 'fortune', actor: 5, target: 6, night: 1 },  // 占い師が狐を占う
      { type: 'attack', actor: 3, target: 5, night: 1 },   // 人狼が占い師を襲撃
      // 追加のアクションシーケンス...
    ],
    votes: [
      { day: 1, votes: [[0,3], [1,3], [2,4], [3,0], [4,0], [6,0]] } // 1日目投票
    ],
    expectedResult: {
      winner: 'fox',
      aliveCount: { total: 3, werewolf: 1, village: 1, fox: 1 }
    }
  });
  ```

- **モックプレイヤー**
  - 自動化されたプレイヤーエージェント
  - 特定の戦略に基づいた行動シミュレーション
  - パフォーマンステスト用の多人数ゲームシミュレーション
  ```javascript
  // モックプレイヤーの例
  const mockStrategies = {
    werewolf: {
      voteStrategy: 'target_seer',      // 占い師を狙って投票
      attackStrategy: 'random_villager' // ランダムな村人を襲撃
    },
    seer: {
      fortuneStrategy: 'random',      // ランダムに占う
      voteStrategy: 'fortune_result'  // 占い結果に基づいて投票
    }
    // 他の役職の戦略...
  };

  // 自動シミュレーション
  const simResult = werewolf.simulateGame({
    playerCount: 7,
    roleDistribution: { werewolf: 2, seer: 1, villager: 4 },
    strategies: mockStrategies,
    turns: 5 // 最大5ターンまでシミュレート
  });
  ```

## 5. インターフェース設計

### 5.1 基本API
```javascript
// ゲームインスタンスの作成
const werewolf = require('werewolf-gm-lib');
const game = werewolf.createGame({
  // 基本設定
  options: {
    randomSeed: 12345,             // 乱数シード（再現性のため）
    allowSameVoteTarget: true,     // 同じ対象への複数票を許可
    executionRule: 'runoff',       // 同数の場合は決選投票
    runoffTieRule: 'random',       // 決選投票でも同数の場合はランダム
    // レギュレーション設定
    regulations: {
      allowConsecutiveGuard: false,  // 連続ガード禁止
      allowRoleMissing: false,       // 役職欠けなし
      firstDayExecution: false,      // 初日処刑なし
      firstNightFortune: 'random_white',  // 初日占いはランダム白
      revealRoleOnDeath: true,       // 死亡時に役職公開
    },
    // 情報可視性オプション（デフォルトは無効）
    visibilityControl: {
      enabled: false,              // 情報可視性管理を有効にするか
      strictMode: false            // 厳格モード（不正な情報アクセスでエラー）
    }
  }
});

// プレイヤー管理
const playerId = game.addPlayer('プレイヤー1');
game.removePlayer(playerId);

// 役職設定と配布
game.setRoles(['villager', 'villager', 'werewolf', 'seer', 'medium']);
game.distributeRoles(); // ランダム配布

// ゲーム進行
game.start();
game.nextPhase(); // 次のフェーズへ
game.endTurn();   // ターン終了

// アクション登録
game.registerAction({
  type: 'fortune',      // 占い
  actor: 0,             // 実行者ID
  target: 2,            // 対象ID
  night: 1              // 夜のターン
});

// 投票
game.vote(3, 1);  // プレイヤー3がプレイヤー1に投票
game.executeVote(); // 投票結果の処理と処刑実行

// イベントリスニング
game.on('playerDeath', (data) => {
  console.log(`プレイヤー${data.playerId}が${data.reason}により死亡しました`);
});

game.on('gameEnd', (data) => {
  console.log(`ゲーム終了: ${data.winner}陣営の勝利`);
});

// 現在の状態取得（すべての情報）
const aliveCount = game.getAlivePlayers().length;
const votes = game.getCurrentVotes();

// 情報可視性機能を使用する場合（オプション）
if (game.options.visibilityControl.enabled) {
  // プレイヤー視点の情報取得
  const playerView = game.getVisibleDataForPlayer(playerId);
  console.log(`プレイヤー${playerId}から見える情報:`, playerView);

  // GM視点の情報取得（すべての情報）
  const gmView = game.getGMView();
}

// エラーハンドリング
try {
  // 無効な操作の試行
  game.vote(deadPlayerId, targetId);
} catch (error) {
  console.error(`エラー: ${error.code} - ${error.message}`);
  console.debug('診断情報:', error.diagnostics);

  // エラー情報をGMに通知
  sendToGM({
    type: 'error',
    errorCode: error.code,
    message: error.message,
    playerContext: playerId
  });
}
```

### 5.2 イベント一覧
- `gameStart` - ゲーム開始時
- `gameEnd` - ゲーム終了時
- `phaseStart` - 各フェーズ開始時
- `phaseEnd` - 各フェーズ終了時
- `turnStart` - 新しいターン開始時
- `turnEnd` - ターン終了時
- `playerDeath` - プレイヤー死亡時
- `actionRegistered` - アクション登録時
- `actionResolved` - アクション解決時
- `voteStart` - 投票開始時
- `voteChange` - 投票変更時
- `voteEnd` - 投票終了時
- `execution` - 処刑実行時
- `roleRevealed` - 役職公開時
- `error` - エラー発生時
- `warning` - 警告発生時

### 5.3 データモデル

#### プレイヤーオブジェクト
```javascript
{
  id: 0,                  // 内部ID（0-indexed）
  name: "プレイヤー1",     // 表示名
  role: "werewolf",       // 役職
  isAlive: true,          // 生存状態
  causeOfDeath: null,     // 死因（処刑、襲撃など）
  deathTurn: null,        // 死亡したターン
  immunity: [],           // 現在の免疫効果
  statusEffects: []       // 状態効果
}
```

#### 役職ベースクラス
```javascript
class Role {
  constructor(game) {
    this.game = game;
    this.name = "baseRole";
    this.team = "neutral";  // village, werewolf, fox, etc.
    this.actions = [];      // 使用可能なアクション
  }

  // 夜行動時の処理
  onNightAction(actor, target, night) {}

  // 被害時の処理（護衛判定など）
  onTargeted(action, source) {}

  // 死亡時の処理
  onDeath(player, cause) {}

  // 情報開示（占い結果など）
  getRevealInfo(viewer) {}
}
```

#### アクションオブジェクト
```javascript
{
  id: "action-123",         // アクションID
  type: "fortune",          // アクション種別
  actor: 0,                 // 実行者ID
  target: 2,                // 対象ID
  night: 1,                 // 実行ターン（夜）
  priority: 10,             // 実行優先度
  executed: false,          // 実行済みフラグ
  result: null,             // 実行結果
  cancelled: false          // キャンセルフラグ
}
```

#### エラーオブジェクト
```javascript
{
  code: "E001",                 // エラーコード
  message: "無効な操作です",      // 表示用メッセージ
  details: "死亡したプレイヤーは投票できません", // 詳細説明
  context: {                    // コンテキスト情報
    playerId: 3,
    action: "vote",
    phase: "day",
    turn: 2
  },
  level: "error",               // エラーレベル
  timestamp: "2023-01-01T12:00:00.000Z", // 発生時刻
  diagnostics: {                // 診断用データ
    gameState: { ... },         // ゲーム状態のスナップショット
    playerState: { ... }        // 関連プレイヤーの状態
  }
}
```

## 6. 拡張性と柔軟性

### 6.1 カスタム役職の追加
```javascript
// カスタム役職の実装例
const werewolf = require('werewolf-gm-lib');

// 猫又役職の実装
class Nekomata extends werewolf.Role {
  constructor(game) {
    super(game);
    this.name = "nekomata";
    this.team = "village";
    this.actions = [];  // 特殊アクションなし

    // 役職メタデータ
    this.metadata = {
      japaneseName: "猫又",
      description: "処刑されたとき、投票した人の中からランダムで1人を道連れにする",
      winCondition: "村人陣営の勝利条件と同じ"
    };
  }

  // 処刑時に投票者を道連れにする処理
  onDeath(player, cause) {
    // 処刑の場合のみ発動
    if (cause === "execution") {
      // 該当プレイヤーに投票したプレイヤーリストを取得
      const voters = this.game.getVotersOf(player.id);

      if (voters.length > 0) {
        // ランダムに1人選ぶ
        const randomIndex = Math.floor(this.game.random() * voters.length);
        const targetId = voters[randomIndex];

        // 道連れ処理
        this.game.killPlayer(targetId, "nekomata_curse");

        // 特殊イベント発火
        this.game.emit('nekomataEffect', {
          nekomataId: player.id,
          targetId: targetId
        });
      }
    }
  }
}

// ライブラリに役職を登録
werewolf.registerRole("nekomata", Nekomata);

// ゲームで使用
const game = werewolf.createGame();
game.setRoles(['villager', 'villager', 'werewolf', 'seer', 'nekomata']);
```

### 6.2 カスタムレギュレーションの適用
```javascript
// レギュレーション設定例
const game = werewolf.createGame({
  options: {
    // 基本的な同票処理設定
    executionRule: 'runoff',  // 同数の場合は決選投票

    // 詳細なレギュレーション設定
    regulations: {
      // 初日関連
      firstDayExecution: false,          // 初日処刑なし
      firstNightFortune: 'free',         // 初日占いは自由選択

      // 役職能力関連
      allowConsecutiveGuard: false,      // 連続ガード禁止
      seerResultType: 'role',            // 占い結果は役職名
      mediumResultType: 'team',          // 霊媒結果は陣営名

      // 人狼能力
      wolfAttackCount: 1,                // 人狼の襲撃は1回/夜
      wolfCanAttackFox: true,            // 狼は狐を襲撃可能

      // 投票・処刑関連
      revealVotes: true,                 // 投票内容を公開
      revealRoleOnDeath: true,           // 死亡時に役職公開
      runoffTieRule: 'no_execution',     // 決選投票でも同数の場合は処刑なし
    }
  }
});

// カスタムルールアドオンの登録例（時間制限ルール）
werewolf.registerRuleAddon('timeLimit', {
  // 初期化時に呼ばれる
  init: (game, options) => {
    game.timeLimit = options.turns || 10;
    game.on('turnStart', (turnData) => {
      if (turnData.turn >= game.timeLimit) {
        game.emit('timeLimitWarning', { turnsLeft: game.timeLimit - turnData.turn });
      }
    });
  },

  // ターン終了時に呼ばれる
  onTurnEnd: (game) => {
    if (game.getCurrentTurn() >= game.timeLimit) {
      // 時間切れによる特殊勝利条件の適用
      game.endGame({
        winner: 'draw',
        reason: 'time_limit_exceeded'
      });
    }
  }
});

// カスタムルールアドオンの有効化
game.enableRuleAddon('timeLimit', { turns: 12 });
```

### 6.3 エラー処理の制御
```javascript
// エラー処理モードの設定
game.setErrorHandlingMode('strict'); // エラー発生時に例外をスローする厳格モード

// または
game.setErrorHandlingMode('lenient'); // 可能な限り処理を続行する寛容モード

// エラーイベントのリスニング
game.on('error', (errorData) => {
  console.error(`エラー発生: ${errorData.code} - ${errorData.message}`);
  // アプリケーション側でのエラーハンドリング
});

// 個別操作の実行
try {
  // 死亡したプレイヤーの投票を試みる
  game.vote(deadPlayerId, targetId);
} catch (e) {
  // エラー処理
  console.error(`投票エラー: ${e.message}`);
  console.debug('診断情報:', e.diagnostics);

  // エラー回復策の提案
  if (e.code === 'DEAD_PLAYER_ACTION') {
    console.log('提案: 生存プレイヤーを選択してください');
  }
}
```

### 6.4 情報可視性の制御（オプション機能）
```javascript
// 情報可視性制御を有効化
const game = werewolf.createGame({
  options: {
    // 基本設定は省略
    visibilityControl: {
      enabled: true,
      strictMode: true  // 権限のない情報アクセスでエラーを発生
    }
  }
});

// プレイヤー視点の情報取得
const playerViewData = game.getVisibleDataForPlayer(playerId);
// 結果例:
// {
//   players: [
//     { id: 0, name: "プレイヤー1", isAlive: true, role: "seer" }, // 自分自身
//     { id: 1, name: "プレイヤー2", isAlive: true, role: null },   // 他プレイヤーの役職は非表示
//     { id: 2, name: "プレイヤー3", isAlive: false, role: "werewolf" } // 死亡プレイヤーは表示（オプション）
//   ],
//   knownResults: [
//     { type: "fortune", target: 1, result: "village", night: 1 } // 占い結果など
//   ],
//   phase: "day",
//   turn: 2,
//   votes: [] // 現在の投票状況
// }

// 役職に応じた特殊情報の取得
const roleSpecificInfo = game.getRoleSpecificInfo(playerId);
// 結果例（人狼の場合）:
// {
//   teammates: [3, 5], // 他の人狼プレイヤーID
//   attackVotes: [     // 襲撃投票状況
//     { voter: 0, target: 2 },
//     { voter: 3, target: 4 }
//   ]
// }

// 情報アクセス権限のカスタマイズ
game.setVisibilityPolicy({
  deadPlayers: {
    canSeeAllRoles: false,         // 死亡プレイヤーが全役職を見られるか
    canSeePrivateChannels: false   // 死亡プレイヤーが非公開チャンネルを見られるか
  },
  roleReveal: {
    onDeath: true,                 // 死亡時に役職公開
    onGameEnd: true                // ゲーム終了時に全役職公開
  },
  voteVisibility: {
    showVoterNames: true,          // 投票者名を表示
    showVoteCount: true            // 得票数を表示
  }
});

// GM専用情報の取得
const gmView = game.getGMView();
// 結果例: すべての情報が含まれる





## 7. 開発方針とロードマップ

### 7.1 開発優先順位
1. コアロジック（プレイヤー管理、役職、フェーズ）
2. 基本役職の実装と依存関係チェック
3. イベントシステム（特に夜行動と投票処理）
4. レギュレーション設定システム
5. アクション処理システム（複数回夜行動対応）
6. 投票システム（決選投票含む）
7. 状態保存・復元システム
8. エラー処理システム（明確な診断情報）
9. 開発支援ツール（シミュレーターなど）
10. 役職拡張システム

### 7.2 テスト戦略
- Jest を用いたユニットテスト
  - 各コンポーネントの独立した動作確認
  - ランダム要素の制御（シード固定）
- 統合テスト
  - イベント伝播と複雑なシナリオのテスト
  - 役職間の相互作用検証
- シナリオテスト
  - 実際のゲームプレイを模した一連のアクション
  - 異常系テスト（不正操作時の挙動）
- テスト支援ツール
  - ゲーム状態のスナップショットテスト
  - テスト用のモック/スタブ提供

### 7.3 ドキュメント
- API リファレンス（JSDoc形式）
- チュートリアルと使用例
  - 基本実装例（DiscordボットとWeb UI）
  - 拡張役職の追加方法
  - カスタムルールの実装方法
- トラブルシューティングガイド
- 開発サポートツールの使用方法

## 8. 技術仕様

### 8.1 環境要件
- Node.js 12.x以上
- ES6互換ブラウザ（クライアントサイド使用時）

### 8.2 パッケージング
- npm パッケージとして公開
- CDN経由での利用サポート
- TypeScript型定義ファイル（d.ts）の提供

### 8.3 依存関係
- 外部依存を最小限に抑える
- イベントエミッターのみ軽量ライブラリを使用

### 8.4 API設計原則
- **一貫性**: 類似の操作は一貫したインターフェースを持つ
- **予測可能性**: 関数名と挙動が直感的に一致する
- **堅牢性**: 入力バリデーションと適切なエラーハンドリング
- **自己文書化**: メソッド名と引数名が明確で説明的
- **診断可能性**: エラー時に詳細な診断情報を提供

### 8.5 同時アクセス対応
- ライブラリ自体は同時アクセス制御を行わない
- 状態変更メソッドは一貫性を保証
- アプリケーション側での同時アクセス制御ガイドラインを提供

### 8.6 デバッグ支援
- 開発モードでの詳細ログ出力
- イベント履歴の記録と参照
- 状態変化の追跡と可視化
- シミュレーターによるシナリオテスト

## 9. 考慮事項とリスク

### 9.1 拡張時の整合性
- 独自役職追加時の依存関係管理
- イベント伝播の複雑化と循環参照の防止
- 拡張役職の標準ルールとの互換性

### 9.2 パフォーマンス
- 7〜20人規模のゲームでの処理速度の確保
- リアルタイム性を重視した設計
- メモリ使用量の最適化

### 9.3 エラー処理と回復
- 不正な操作（死亡者による投票など）の適切な処理
- ゲーム状態の整合性チェックと回復
- エラー発生時のイベント発火と通知
- 詳細な診断情報の提供によるデバッグ支援

### 9.4 テスト容易性
- 複雑なゲームロジックのテスト戦略
- Jestによる効果的なテストケース設計のサポート
- ランダム要素を含むロジックのテスト方法
- シミュレーションによる自動テスト

### 9.5 運用と管理
- 内部公開を前提とした品質管理と保守
- 将来的な拡張とバージョン管理
- ドキュメント整備と継続的改善

### 9.6 アプリケーション連携
- 様々なアプリケーション形態（Discord bot、Web UI等）との連携
- アプリケーション側での同時アクセス制御の必要性
- 情報可視性管理をオプション機能として提供する際の整合性
  - アプリケーション側で情報管理を行う場合のガイドライン提供
  - ライブラリ側で提供する場合のオーバーヘッドとメリット# 人狼ゲームGM支援ライブラリ 要件定義書
