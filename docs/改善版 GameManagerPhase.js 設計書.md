# 改善版 GameManagerPhase.js 設計書

## 1. 概要

`GameManagerPhase.js` は人狼ゲームGM支援ライブラリの中核モジュールとして、ゲームのフェーズ管理機能を提供します。このモジュールはGameManagerのMix-inとして実装され、フェーズ遷移、ターン管理、フェーズ固有の処理など、ゲーム進行に関わる各種メソッドを担当します。

## 2. 目的と役割

このモジュールは以下の主要な責務を持ちます：
- ゲームの開始と初期フェーズへの移行
- フェーズ間の遷移管理
- ターン進行の制御
- 現在のフェーズやターン情報の提供
- フェーズ固有の処理（夜、昼、投票など）
- ゲーム終了条件の監視と終了処理

## 3. 実装方針

`GameManagerPhase.js`はMix-inパターンを採用し、GameManagerのプロトタイプを拡張します。各機能カテゴリに分類された一連のメソッドを提供します。

### 3.1 状態管理と一貫性の確保

状態更新の一貫性を担保するため、トランザクション的なアプローチを導入します：

```javascript
// 状態変更トランザクション機構
beginStateTransaction() {
  this._stateSnapshot = JSON.parse(JSON.stringify(this.state));
  this._transactionInProgress = true;
}

commitStateTransaction() {
  this._stateSnapshot = null;
  this._transactionInProgress = false;
}

rollbackStateTransaction() {
  if (this._stateSnapshot) {
    this.state = JSON.parse(JSON.stringify(this._stateSnapshot));
    this._stateSnapshot = null;
    this._transactionInProgress = false;
    return true;
  }
  return false;
}
```

### 3.2 フェーズ遷移マトリックスの定義

特定のフェーズ間の遷移時の特殊処理をマトリックスとして定義します：

```javascript
// フェーズ遷移マトリックス
const phaseTransitionHandlers = {
  'day-vote': this.handleDayToVoteTransition,
  'vote-execution': this.handleVoteToExecutionTransition,
  'execution-night': this.handleExecutionToNightTransition,
  'night-day': this.handleNightToDayTransition,
  'day-night': this.handleDayToNightTransition, // 初日処刑なしの場合
  // 他の特殊遷移...
};

// 遷移ハンドラの呼び出し
const transitionKey = `${fromPhase.id}-${toPhase.id}`;
if (phaseTransitionHandlers[transitionKey]) {
  phaseTransitionHandlers[transitionKey](fromPhase, toPhase);
}
```

### 3.3 エラー回復メカニズム

フェーズ遷移中のエラーから回復するための機能を追加します：

```javascript
// エラー回復機能
handlePhaseTransitionError(error, fromPhase, toPhaseId) {
  // エラーログ記録
  this.logger.error(`Phase transition error: ${error.message}`, {
    fromPhase: fromPhase.id,
    toPhase: toPhaseId,
    turn: this.state.turn
  });

  // トランザクションのロールバック
  if (this._transactionInProgress) {
    this.rollbackStateTransaction();
  }

  // エラー回復試行
  try {
    // 現在のフェーズを再確認
    const currentPhase = this.phaseManager.getCurrentPhase();
    // 状態の整合性確認
    this.verifyGameState();
    
    // エラー回復イベント発火
    this.eventSystem.emit('phase.transition.error.recovery', {
      error: error.message,
      fromPhase: fromPhase.id,
      currentPhase: currentPhase.id,
      turn: this.state.turn
    });
    
    return currentPhase;
  } catch (recoveryError) {
    // 回復失敗、原エラーを再スロー
    throw error;
  }
}
```

### 3.4 状態の検証と修復機能

ゲーム状態の一貫性を検証し、必要に応じて修復する機能を提供します：

```javascript
// 状態検証機能
verifyGameState() {
  const issues = [];
  
  // フェーズとステートの整合性検証
  const currentPhase = this.phaseManager.getCurrentPhase();
  if (currentPhase && this.state.phase !== currentPhase.id) {
    issues.push({
      type: 'phase_mismatch',
      message: `Phase ID mismatch: state=${this.state.phase}, manager=${currentPhase.id}`
    });
    
    // 自動修復
    this.state.phase = currentPhase.id;
  }
  
  // ターン数の検証
  if (this.state.turn < 1 && this.state.isStarted) {
    issues.push({
      type: 'invalid_turn',
      message: `Invalid turn number: ${this.state.turn}`
    });
    
    // 自動修復
    this.state.turn = 1;
  }
  
  // その他の状態検証...
  
  // 問題があれば警告イベント発火
  if (issues.length > 0) {
    this.eventSystem.emit('state.inconsistency', {
      issues,
      fixed: true,
      timestamp: Date.now()
    });
  }
  
  return issues.length === 0;
}
```

### 3.5 フェーズ進行ログ機能

ゲーム進行の追跡と分析を容易にするためのログ機能を追加します：

```javascript
// フェーズ遷移ログ
logPhaseTransition(fromPhase, toPhase, reason = 'normal') {
  const logEntry = {
    timestamp: Date.now(),
    turn: this.state.turn,
    fromPhase: fromPhase ? fromPhase.id : null,
    toPhase: toPhase.id,
    reason,
    playerCount: this.playerManager.getAlivePlayers().length
  };
  
  // 内部ログの保存
  this._phaseTransitionHistory = this._phaseTransitionHistory || [];
  this._phaseTransitionHistory.push(logEntry);
  
  // 最大履歴サイズの制限（パフォーマンス対策）
  if (this._phaseTransitionHistory.length > 100) {
    this._phaseTransitionHistory.shift();
  }
  
  // オプションのログイベント発火
  if (this.options.debugMode) {
    this.eventSystem.emit('debug.phase.transition', logEntry);
  }
  
  return logEntry;
}
```

## 4. メソッド詳細仕様

### 4.1 ゲーム開始関連

#### start()
- **目的**: ゲームを開始し、初期フェーズに移行する
- **事前条件**: プレイヤーが追加済み、役職が配布済み、ゲーム未開始
- **処理**: 
  1. トランザクション開始
  2. ゲーム状態の検証（未開始、プレイヤー数、役職配布）
  3. ゲーム開始前イベント発火
  4. ゲーム状態の更新（開始状態に設定、ターン=1）
  5. 初期フェーズへの移行
  6. ゲーム開始後イベント発火
  7. トランザクションコミット
- **例外処理**:
  - エラー発生時にトランザクションをロールバック
  - 適切なエラーコードとメッセージを付与して再スロー
- **戻り値**: 成功時true
- **イベント**: 
  - `game.starting`: 開始処理前
  - `game.started`: 開始処理後

### 4.2 フェーズ遷移関連

#### nextPhase()
- **目的**: 現在のフェーズから次のフェーズへ移行する
- **事前条件**: ゲーム開始済み、未終了
- **処理**:
  1. トランザクション開始
  2. ゲーム状態の検証
  3. 現在のフェーズ終了処理
  4. フェーズ遷移前イベント発火
  5. 次フェーズへの移行
  6. 必要に応じてターン増加
  7. 特殊フェーズ遷移処理
  8. フェーズ遷移後イベント発火
  9. 新フェーズの開始処理
  10. 勝利条件チェック
  11. 遷移ログの記録
  12. トランザクションコミット
- **例外処理**:
  - エラー発生時に回復処理を試行
  - 回復不可能な場合はトランザクションをロールバックして再スロー
- **戻り値**: 移行後のフェーズ情報
- **イベント**:
  - `phase.transition.before`: 遷移前
  - `phase.transition.after`: 遷移後
  - `turn.new`: ターン増加時
  - `phase.start.[phaseId]`: 新フェーズ開始時

#### moveToPhase(phaseId)
- **目的**: 指定したフェーズへ直接移行する
- **事前条件**: ゲーム開始済み、未終了
- **処理**:
  1. トランザクション開始
  2. ゲーム状態の検証
  3. 現在のフェーズ終了処理
  4. フェーズ遷移前イベント発火
  5. 指定フェーズへの移行
  6. 特殊フェーズ遷移処理
  7. フェーズ遷移後イベント発火
  8. 新フェーズの開始処理
  9. 遷移ログの記録
  10. トランザクションコミット
- **例外処理**:
  - エラー発生時に回復処理を試行
  - 回復不可能な場合はトランザクションをロールバックして再スロー
- **戻り値**: 移行後のフェーズ情報
- **イベント**:
  - `phase.transition.before`: 遷移前
  - `phase.transition.after`: 遷移後
  - `phase.start.[phaseId]`: 新フェーズ開始時

### 4.3 フェーズ情報関連

#### getCurrentPhase()
- **目的**: 現在のフェーズ情報を取得する
- **事前条件**: ゲーム開始済み
- **処理**:
  1. ゲーム状態の検証
  2. PhaseManagerから現在のフェーズを取得
  3. フェーズ情報の整合性確認
- **例外処理**:
  - ゲーム未開始エラー
  - フェーズ情報不整合の場合は自動修復を試行
- **戻り値**: 現在のフェーズオブジェクト

#### getCurrentTurn()
- **目的**: 現在のターン数を取得する
- **事前条件**: ゲーム開始済み
- **処理**:
  1. ゲーム状態の検証
  2. ターン数の整合性確認
- **例外処理**: ゲーム未開始エラー
- **戻り値**: 現在のターン数（数値）

#### getDayNightCycle()
- **目的**: 現在の昼/夜サイクルを判定して返す
- **事前条件**: ゲーム開始済み
- **処理**:
  1. ゲーム状態の検証
  2. 現在のフェーズに基づいて"day"または"night"を判定
- **例外処理**: ゲーム未開始エラー
- **戻り値**: "day" または "night"

#### isPhase(phaseId)
- **目的**: 現在のフェーズが指定IDと一致するか確認
- **事前条件**: ゲーム開始済み
- **処理**:
  1. ゲーム状態の検証
  2. 現在のフェーズIDと指定IDを比較
- **例外処理**: ゲーム未開始エラー
- **戻り値**: 一致する場合true、それ以外はfalse

### 4.4 フェーズ処理関連

#### handlePhaseStart(phase)
- **目的**: フェーズ開始時の共通処理と分岐処理
- **処理**:
  1. フェーズIDによる分岐
  2. 適切なフェーズハンドラの呼び出し
  3. フェーズ開始イベントの発火
- **戻り値**: なし
- **イベント**: `phase.start.[phaseId]`

#### handlePhaseEnd(phase)
- **目的**: フェーズ終了時の共通処理と分岐処理
- **処理**:
  1. フェーズIDによる分岐
  2. 適切なフェーズ終了ハンドラの呼び出し
  3. フェーズ終了イベントの発火
- **戻り値**: なし
- **イベント**: `phase.end.[phaseId]`

#### handleDayPhaseStart()
- **目的**: 昼フェーズ開始時の処理
- **処理**:
  1. 状態効果のクリア（護衛など）
  2. 初日処刑なしの場合の特殊処理
- **戻り値**: なし
- **イベント**: 初日処刑なしの場合 `firstDay.noExecution`

#### handleVotePhaseStart()
- **目的**: 投票フェーズ開始時の処理
- **処理**:
  1. 投票マネージャーのリセット
  2. 投票対象リストの設定
- **戻り値**: なし
- **イベント**: `vote.start`

#### handleNightPhaseStart()
- **目的**: 夜フェーズ開始時の処理
- **処理**:
  1. アクションマネージャーのリセット
  2. 初日占いルールの適用
- **戻り値**: なし
- **イベント**: `night.start`

#### handleGameEndPhaseStart()
- **目的**: ゲーム終了フェーズ開始時の処理
- **処理**:
  1. ゲーム終了状態への更新
  2. 勝者情報の取得と設定
  3. ゲーム終了イベントの発火
- **戻り値**: なし
- **イベント**: `game.end`

### 4.5 特殊フェーズ遷移処理

#### handleDayToNightTransition(dayPhase, nightPhase)
- **目的**: 初日処刑なしの場合の昼→夜への直接遷移を処理
- **処理**:
  1. 初日かつ初日処刑なしレギュレーションの確認
  2. 特殊イベントの発火
- **戻り値**: なし
- **イベント**: `firstDay.noExecution`

#### handleExecutionToNightTransition(executionPhase, nightPhase)
- **目的**: 処刑→夜遷移時の処理（ターン進行含む）
- **処理**:
  1. ターン増加処理
  2. 新ターン開始イベントの発火
- **戻り値**: なし
- **イベント**: `turn.new`

### 4.6 その他ユーティリティ

#### setTurn(turn)
- **目的**: ターン数を直接設定（主にテスト用）
- **処理**:
  1. 入力の検証
  2. ターン数の設定
  3. イベント発火
- **戻り値**: 成功時true
- **イベント**: `turn.set`

#### getPhaseHistory(limit = null)
- **目的**: フェーズ遷移履歴を取得
- **処理**: 内部に保存されたフェーズ遷移ログを返す
- **戻り値**: フェーズ遷移履歴の配列（最新順）

## 5. イベント一覧

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `game.starting` | ゲーム開始処理前 | `{playerCount}` |
| `game.started` | ゲーム開始処理後 | `{playerCount, initialPhase}` |
| `phase.transition.before` | フェーズ遷移前 | `{fromPhase, toPhaseId, turn}` |
| `phase.transition.after` | フェーズ遷移後 | `{fromPhase, toPhase, turn}` |
| `phase.transition.error` | フェーズ遷移エラー時 | `{error, fromPhase, toPhaseId}` |
| `phase.transition.error.recovery` | エラー回復成功時 | `{error, currentPhase}` |
| `phase.start.[phaseId]` | 各フェーズ開始時 | `{phase, turn}` |
| `phase.end.[phaseId]` | 各フェーズ終了時 | `{phase, turn}` |
| `turn.new` | 新ターン開始時 | `{turn, previousTurn}` |
| `turn.set` | ターン手動設定時 | `{turn, previousTurn}` |
| `firstDay.noExecution` | 初日処刑なしルール適用時 | `{turn}` |
| `game.end` | ゲーム終了時 | `{winner, reason, winningPlayers}` |
| `state.inconsistency` | 状態不整合検出時 | `{issues, fixed}` |
| `debug.phase.transition` | デバッグモード時の遷移ログ | `{fromPhase, toPhase, turn, reason}` |

## 6. 設計上の注意点

### 6.1 エラー処理と回復

- フェーズ遷移中のエラーは頻繁に発生する可能性があり、適切な回復機構が重要
- トランザクション機構を活用して状態の一貫性を保証
- エラー発生時には詳細な診断情報を提供

### 6.2 状態の一貫性保証

- 複数モジュールにまたがる状態更新は常にトランザクション内で実行
- 状態の検証と修復機能で不整合を早期に検出
- イベント発火によるサイドエフェクトにも注意

### 6.3 パフォーマンス考慮事項

- 大規模ゲーム（多数のプレイヤー）でのパフォーマンス最適化
- ロギングや履歴データの量を制限
- メモリリークを防ぐための適切なクリーンアップ

### 6.4 拡張性への配慮

- カスタムフェーズと遷移パターンの追加を容易にする設計
- フェーズハンドラの拡張ポイントを明確に定義
- フェーズ遷移マトリックスの柔軟な設定方法を提供

## 7. テスト戦略

### 7.1 ユニットテスト

- 各メソッドの正常系・異常系のテスト
- 境界条件の検証
- モックを活用した依存コンポーネントの分離

### 7.2 統合テスト

- フェーズ遷移シーケンスの検証
- イベント発火と処理の連携テスト
- レギュレーション設定の影響テスト

### 7.3 シナリオテスト

- 実際のゲーム進行を模したフェーズ遷移シーケンス
- エラー回復機能の検証
- パフォーマンステスト（多数の遷移を連続実行）

## 8. 依存モジュールとの連携

### 8.1 PhaseManager

- フェーズの定義と遷移ルールの管理
- フェーズコンテキスト情報の提供
- 実際のフェーズ遷移処理の実行

### 8.2 EventSystem

- フェーズ遷移に関連するイベントの発火
- イベントを通じた他モジュールとの連携
- 診断情報の通知

### 8.3 PlayerManager

- プレイヤー情報の取得
- 生存プレイヤーのフィルタリング
- プレイヤー状態の更新

### 8.4 VoteManager

- 投票フェーズでの投票管理
- 投票結果の集計
- 処刑対象の決定

### 8.5 ActionManager

- 夜フェーズでのアクション管理
- アクション実行順序の制御
- アクション結果の処理

### 8.6 VictoryManager

- 勝利条件のチェック
- 勝者情報の提供
- ゲーム終了条件の判定

## 9. 実装例の詳細設計（代表的なメソッド）

### 9.1 nextPhase() メソッドの詳細フロー

```
1. ゲーム状態の検証
   - ゲーム開始済みか確認
   - ゲーム未終了か確認

2. トランザクション開始
   beginStateTransaction()

3. 現在のフェーズを取得
   currentPhase = phaseManager.getCurrentPhase()

4. フェーズ遷移前イベント発火
   eventSystem.emit('phase.transition.before', { 
     fromPhase: currentPhase, 
     turn: state.turn 
   })

5. 現在のフェーズ終了処理
   handlePhaseEnd(currentPhase)

6. 次フェーズへの移行
   nextPhase = phaseManager.moveToNextPhase()

7. 新しいターンかどうかチェック
   if (nextPhase.newTurn) {
     // ターン増加処理
     state.turn++
     eventSystem.emit('turn.new', { turn: state.turn })
   }

8. 状態更新
   state.phase = nextPhase.id

9. 特殊フェーズ遷移処理
   const transitionKey = `${currentPhase.id}-${nextPhase.id}`
   if (phaseTransitionHandlers[transitionKey]) {
     phaseTransitionHandlers[transitionKey](currentPhase, nextPhase)
   }

10. フェーズ遷移後イベント発火
    eventSystem.emit('phase.transition.after', {
      fromPhase: currentPhase,
      toPhase: nextPhase,
      turn: state.turn
    })

11. 新フェーズの開始処理
    handlePhaseStart(nextPhase)

12. 勝利条件チェック
    victoryManager.checkWinCondition()
    if (victoryManager.isGameEnd()) {
      // ゲーム終了フェーズへ移行
      moveToPhase('gameEnd')
      // ここでは元の nextPhase を返す（moveToPhase内で gameEnd が処理される）
    }

13. 遷移ログの記録
    logPhaseTransition(currentPhase, nextPhase)

14. トランザクションコミット
    commitStateTransaction()

15. 結果返却
    return nextPhase
```

### 9.2 start() メソッドの詳細フロー

```
1. ゲーム状態の検証
   - ゲーム未開始か確認
   - プレイヤー数が最小数以上か確認
   - 役職が配布済みか確認

2. トランザクション開始
   beginStateTransaction()

3. プレイヤー情報取得
   players = playerManager.getAllPlayers()

4. ゲーム開始前イベント発火
   eventSystem.emit('game.starting', { 
     playerCount: players.length 
   })

5. ゲーム状態の更新
   state.isStarted = true
   state.turn = 1
   state.startTime = Date.now()

6. 初期フェーズへの移行
   initialPhase = phaseManager.moveToInitialPhase({
     regulations: options.regulations
   })

7. 状態更新
   state.phase = initialPhase.id

8. 初期フェーズの開始処理
   handlePhaseStart(initialPhase)

9. ゲーム開始後イベント発火
   eventSystem.emit('game.started', {
     playerCount: players.length,
     initialPhase: initialPhase.id,
     turn: state.turn,
     timestamp: Date.now()
   })

10. トランザクションコミット
    commitStateTransaction()

11. 結果返却
    return true
```

## 10. まとめと今後の課題

本設計書では、GameManagerPhaseモジュールの機能要件と実装方針を詳細に定義しました。特に状態の一貫性管理、エラー回復、拡張性に重点を置き、より堅牢なモジュールとなるよう設計を改善しています。今後の課題としては以下が考えられます：

1. **拡張システムの詳細設計**: カスタムフェーズと遷移パターンの登録インターフェースの詳細化
2. **パフォーマンス最適化**: 大規模ゲームでの最適化手法の具体化
3. **状態復元機能の強化**: 中断されたゲームの復元機能の実装
4. **診断・デバッグツールの拡充**: より詳細な内部状態の可視化と分析ツールの提供

この設計に基づいて実装を進めることで、信頼性の高いフェーズ管理モジュールが実現できると考えられます。
