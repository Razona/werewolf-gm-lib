# GameManagerPhase テスト設計書（改善版）

## 1. 概要

このドキュメントは人狼ゲームGM支援ライブラリの `GameManagerPhase` モジュールに対するテスト計画を記述したものです。このモジュールはゲームのフェーズ管理、フェーズ遷移、ターン進行の制御など、ゲーム進行の中核となる機能を担当しています。

## 2. テスト環境

- **フレームワーク**: Jest
- **テストファイル場所**: `__tests__/unit/service/gameManager/GameManagerPhase.test.js`
- **アプローチ**: モックを活用した単体テスト
- **実行環境**: Node.js (v16+)
- **テストカバレッジ目標**: 95% 以上（機能・条件分岐）

## 3. テスト優先度分類

テストケースに優先度を設定し、リソースやスケジュールに制約がある場合の判断基準とします。

| 優先度 | 説明 |
|------|------|
| P0 | クリティカル - 必ず実行すべき最重要テスト。基本機能とエラー条件の検証 |
| P1 | 高優先度 - 通常のテスト実行では必ず含めるべきテスト。標準的なユースケース |
| P2 | 中優先度 - できる限り実行すべきテスト。エッジケースや特殊条件 |
| P3 | 低優先度 - 時間とリソースが許す場合に実行するテスト。特殊なシナリオやパフォーマンス |

## 4. テスト共通データとユーティリティ

### 4.1 共通テストフィクスチャ

```javascript
// テスト用の共通プレイヤーデータ
const testPlayers = [
  { id: 0, name: "Player1", isAlive: true },
  { id: 1, name: "Player2", isAlive: true },
  { id: 2, name: "Player3", isAlive: true },
  { id: 3, name: "Player4", isAlive: true }
];

// 標準フェーズ定義
const standardPhases = {
  preparation: { id: "preparation", displayName: "準備フェーズ" },
  night: { id: "night", displayName: "夜フェーズ" },
  day: { id: "day", displayName: "昼フェーズ" },
  vote: { id: "vote", displayName: "投票フェーズ" },
  execution: { id: "execution", displayName: "処刑フェーズ" },
  gameEnd: { id: "gameEnd", displayName: "ゲーム終了" }
};

// 標準レギュレーション
const standardRegulations = {
  firstDayExecution: false,
  allowConsecutiveGuard: false,
  executionRule: 'runoff'
};
```

### 4.2 テストヘルパー関数

```javascript
// GameManagerとモックのセットアップ
function setupGameManager(options = {}) {
  // 初期状態とモックのセットアップ
  // ...
  return {
    gameManager,
    mocks: {
      eventSystem: mockEventSystem,
      errorHandler: mockErrorHandler,
      // ...その他のモック
    }
  };
}

// イベント発火検証ヘルパー
function verifyEventEmitted(mockEventSystem, eventName, expectedData) {
  // イベントが期待通りに発火されたか検証
  // ...
}

// モック関数呼び出し検証ヘルパー
function verifyMethodCalled(mockFunction, expectedArgs) {
  // モック関数が期待する引数で呼ばれたか検証
  // ...
}

// テスト後のクリーンアップ
function cleanupTest(testInstance) {
  // テスト間の状態リセット
  // ...
}
```

## 5. モックの設計

テストで使用する各種モックの詳細設計です。各モックはテスト間で再利用しつつも、テスト中の状態汚染を避けるため、テスト前に初期化されます。

### 5.1 EventSystem モック

```javascript
const createMockEventSystem = () => ({
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
  hasListeners: jest.fn().mockReturnValue(false),
  // イベント履歴を記録するためのヘルパー機能
  _eventHistory: [],
  _recordEvent(name, data) {
    this._eventHistory.push({ name, data, timestamp: Date.now() });
  },
  _getEventHistory(filter = null) {
    if (filter) {
      return this._eventHistory.filter(e => e.name.match(filter));
    }
    return [...this._eventHistory];
  },
  _reset() {
    this._eventHistory = [];
    this.on.mockClear();
    this.off.mockClear();
    this.once.mockClear();
    this.emit.mockClear();
    this.hasListeners.mockClear();
  }
});
```

### 5.2 ErrorHandler モック

```javascript
const createMockErrorHandler = () => ({
  createError: jest.fn((code, message) => {
    const error = new Error(message);
    error.code = code;
    return error;
  }),
  handleError: jest.fn(),
  // エラー履歴を記録
  _errorHistory: [],
  _recordError(code, message, context) {
    this._errorHistory.push({ code, message, context, timestamp: Date.now() });
  },
  _getErrorHistory() {
    return [...this._errorHistory];
  },
  _reset() {
    this._errorHistory = [];
    this.createError.mockClear();
    this.handleError.mockClear();
  }
});
```

### 5.3 PhaseManager モック

```javascript
const createMockPhaseManager = () => ({
  getCurrentPhase: jest.fn(),
  moveToNextPhase: jest.fn(),
  moveToPhase: jest.fn(),
  moveToInitialPhase: jest.fn(),
  getPhaseContext: jest.fn(),
  // フェーズ遷移履歴
  _transitionHistory: [],
  _recordTransition(from, to) {
    this._transitionHistory.push({
      from,
      to,
      timestamp: Date.now()
    });
  },
  _getTransitions() {
    return [...this._transitionHistory];
  },
  _reset() {
    this._transitionHistory = [];
    this.getCurrentPhase.mockClear();
    this.moveToNextPhase.mockClear();
    this.moveToPhase.mockClear();
    this.moveToInitialPhase.mockClear();
    this.getPhaseContext.mockClear();
  }
});
```

残りのモックについても同様に、履歴記録と初期化機能を追加します。これにより、テスト中の呼び出し履歴の検証や、テスト間の状態リセットが容易になります。

## 6. テストケース

優先度を付けて、より詳細なテストケースを定義します。

### 6.1 `start()` メソッドのテスト

#### 6.1.1 正常系のテスト

**テスト名**: 基本的なゲーム開始が正常に行われる [P0]

**概要**: プレイヤーが追加され役職が配布された状態で、ゲームが正常に開始されることを確認します。

**前提条件**:
- ゲームが開始されている
- PhaseManagerが一連のフェーズ遷移を適切に処理できるよう設定されている

**テストデータ**:
- 初期フェーズ: { id: "night", displayName: "夜フェーズ" }
- フェーズシーケンス: night → day → vote → execution → night
- ゲーム状態: { isStarted: true, isEnded: false, turn: 1 }

**テスト手順**:
1. ゲーム開始状態のGameManagerインスタンスをセットアップ
2. 各フェーズ遷移のモック応答を設定
3. 5回のnextPhase()呼び出しを連続して実行
4. 各ステップでの状態とイベント発火を検証

**期待結果**:
- 全てのフェーズが適切な順序で遷移する
- 適切なタイミングでターン増加が発生する（execution → night）
- 全てのフェーズ固有ハンドラが正しく呼ばれる
- イベントが正しい順序で発火される

**検証方法**:
- フェーズシーケンスの検証: モックの呼び出し履歴を検証
- ターン進行の検証: `expect(gameManager.state.turn).toBe(2)`（最終的に）
- イベント順序の検証: イベント履歴の順序を検証

---

**テスト名**: 同数得票時の決選投票フェーズへの遷移 [P2]

**概要**: 投票で同数得票が発生した場合に決選投票フェーズへの遷移が正しく行われることを確認します。

**前提条件**:
- ゲームが進行中である
- 現在が投票フェーズである
- 同数得票が発生する状況が設定されている

**テストデータ**:
- 現在のフェーズ: { id: "vote", displayName: "投票フェーズ" }
- 次のフェーズ: { id: "runoffVote", displayName: "決選投票フェーズ" }
- 投票結果: { isTie: true, maxVoted: [1, 2] }
- ゲーム状態: { isStarted: true, isEnded: false, turn: 1 }

**テスト手順**:
1. 投票フェーズのGameManagerインスタンスをセットアップ
2. VoteManagerが同数得票結果を返すよう設定
3. PhaseManagerが決選投票フェーズへの遷移を適切に処理するよう設定
4. nextPhase()メソッドを呼び出す
5. 決選投票フェーズへの遷移を検証

**期待結果**:
- 決選投票フェーズに遷移する
- 「phase.start.runoffVote」イベントが発火される
- 決選投票の対象が同数得票者に設定される

**検証方法**:
- フェーズ遷移の検証: `expect(result.id).toBe("runoffVote")`
- イベント発火の検証: `verifyEventEmitted(mocks.eventSystem, "phase.start.runoffVote", expect.anything())`
- 決選投票設定の検証: VoteManagerへの適切なパラメータ設定を確認

---

**テスト名**: 状態破損からの復旧処理 [P3]

**概要**: 予期せぬ状態破損が発生した場合の復旧処理が適切に機能することを確認します。

**前提条件**:
- ゲームが開始されている
- 状態が部分的に破損している（例: フェーズIDは存在するがフェーズオブジェクトが取得できない）

**テストデータ**:
- 現在のフェーズID: "night"
- PhaseManager.getCurrentPhaseがnullを返す状況
- ゲーム状態: { isStarted: true, isEnded: false, turn: 1, phase: "night" }

**テスト手順**:
1. 状態破損のあるGameManagerインスタンスをセットアップ
2. nextPhase()メソッドを呼び出す
3. エラー処理と復旧処理を検証

**期待結果**:
- エラーが検出される
- 復旧処理が実行される（例: デフォルトの次フェーズに移行）
- エラーイベントが発火される
- 状態の整合性が回復される

**検証方法**:
- エラー処理の検証: エラーハンドラの呼び出しを確認
- 復旧処理の検証: 状態が一貫した状態に回復されていることを確認
- イベント発火の検証: `verifyEventEmitted(mocks.eventSystem, "error.recovery", expect.anything())`

### 7.2 パフォーマンステスト

**テスト名**: 長時間ゲーム進行のメモリリーク検証 [P3]

**概要**: 長時間のゲーム進行（多数のターンとフェーズ遷移）でメモリリークが発生しないことを確認します。

**前提条件**:
- ゲームが開始されている
- 長時間実行をシミュレートできるよう設定されている

**テストデータ**:
- 初期フェーズ: { id: "night", displayName: "夜フェーズ" }
- ゲーム状態: { isStarted: true, isEnded: false, turn: 1 }

**テスト手順**:
1. メモリ使用量の初期測定
2. 100ターン分のフェーズ遷移をシミュレーション（フェーズごとにnextPhase()を呼ぶ）
3. メモリ使用量の最終測定
4. メモリリークの有無を分析

**期待結果**:
- メモリ使用量が一定範囲内に収まる
- メモリリークの兆候が見られない
- イベントリスナーが適切に管理されている

**検証方法**:
- メモリ使用量の比較: 初期と最終のメモリ使用量の差が許容範囲内か確認
- イベントリスナー管理の検証: リスナーが適切に追加・削除されているか確認
- ヒープスナップショット分析（可能な場合）

---

**テスト名**: 大量のイベントリスナーでのパフォーマンス [P3]

**概要**: 多数のイベントリスナーが登録されている状態でのフェーズ遷移パフォーマンスを確認します。

**前提条件**:
- ゲームが開始されている
- 様々なフェーズイベントに多数のリスナーが登録されている

**テストデータ**:
- 現在のフェーズ: { id: "day", displayName: "昼フェーズ" }
- 登録リスナー数: フェーズイベントごとに50リスナー

**テスト手順**:
1. 多数のイベントリスナーを登録
2. 実行時間の測定開始
3. nextPhase()メソッドを呼び出す
4. 実行時間の測定終了
5. パフォーマンスを評価

**期待結果**:
- 実行時間が許容範囲内である（例: 100ms以内）
- すべてのイベントが正しく処理される
- リソース消費が過剰にならない

**検証方法**:
- 実行時間の測定と評価
- イベント処理の検証: すべてのリスナーが呼び出されたことを確認
- システムリソース使用状況の監視（可能な場合）

## 8. 統合シナリオテスト

**テスト名**: 基本的なゲーム進行シナリオ [P1]

**概要**: ゲーム開始から勝利条件達成までの一連のフェーズ遷移と状態変化を検証します。

**前提条件**:
- GameManagerの初期状態
- 適切なモック設定（プレイヤー、役職、フェーズ遷移）

**テストデータ**:
- プレイヤー: 標準テストプレイヤー4人
- 役職: 村人2人、人狼1人、占い師1人
- フェーズシーケンス: preparation → night → day → vote → execution → night → ...

**テスト手順**:
1. ゲームセットアップ（プレイヤー追加、役職設定）
2. ゲーム開始（start()呼び出し）
3. 一連のフェーズ遷移実行（nextPhase()複数回呼び出し）
4. 特定のタイミングで勝利条件を満たす状態を設定
5. 最終的な勝利処理の検証

**期待結果**:
- ゲームが適切に開始される
- 各フェーズが正しい順序で遷移する
- 特定のタイミングでターン数が増加する
- 勝利条件達成時にゲームが適切に終了する
- 正しい勝者情報が設定される

**検証方法**:
- 各ステップでの状態検証
- フェーズ遷移シーケンスの検証
- ターン進行のタイミング検証
- 最終状態の検証: `expect(gameManager.state.isEnded).toBe(true)`
- 勝者情報の検証: `expect(gameManager.state.winner).toBe("village")`

---

**テスト名**: レギュレーション適用シナリオ [P2]

**概要**: 様々なレギュレーション（初日処刑なし、決選投票など）が適用されたゲーム進行を検証します。

**前提条件**:
- 特定のレギュレーションが設定されたGameManager
- 適切なモック設定

**テストデータ**:
- レギュレーション: { firstDayExecution: false, executionRule: 'runoff' }
- プレイヤー: 標準テストプレイヤー5人
- 初期フェーズシーケンス: preparation → night → day → night（初日処刑なし）

**テスト手順**:
1. レギュレーション設定付きでゲームをセットアップ
2. ゲーム開始
3. フェーズ遷移の検証（特に初日昼→夜の直接遷移）
4. 同数得票を発生させて決選投票への遷移を検証
5. 一連のフェーズ遷移でレギュレーションが一貫して適用されることを確認

**期待結果**:
- 初日は昼フェーズから直接夜フェーズに移行する（投票スキップ）
- 同数得票時は決選投票フェーズに移行する
- レギュレーションが一貫して適用される

**検証方法**:
- 初日処刑なしの検証: 昼から夜への直接遷移を確認
- 決選投票の検証: 同数得票時に決選投票フェーズへ移行することを確認
- 一貫性の検証: レギュレーションが全ターンで適切に適用されていることを確認

## 9. テスト実装順序と優先度

テスト実装は以下の順序で進めることを推奨します。各グループの中でP0→P1→P2→P3の順に実装します。

1. **基本機能とユーティリティのテスト**
   - getCurrentPhase, getCurrentTurn などの基本メソッド
   - isPhase, getDayNightCycle などのユーティリティメソッド

2. **start()メソッドのテスト**
   - 正常系（基本的なゲーム開始）
   - 異常系（エラーケース）

3. **nextPhase()メソッドのテスト**
   - 基本的なフェーズ遷移
   - 特殊条件下での遷移（初日処刑なし、ターン進行など）
   - 異常系（エラーケース）

4. **moveToPhase()メソッドのテスト**
   - 特定フェーズへの直接移行
   - 異常系（エラーケース）

5. **フェーズハンドラメソッドのテスト**
   - 各フェーズ開始時の処理
   - フェーズ固有の処理

6. **エッジケースとパフォーマンステスト**
   - 複雑な遷移シーケンス
   - エラー回復処理
   - パフォーマンス関連テスト

7. **統合シナリオテスト**
   - 基本的なゲーム進行
   - レギュレーション適用シナリオ

## 10. テスト成功基準

テストの成功基準は以下の通りです：

1. **カバレッジ基準**:
   - ステートメントカバレッジ: 95%以上
   - 分岐カバレッジ: 90%以上
   - 関数カバレッジ: 100%（全ての公開メソッドをテスト）

2. **機能網羅性**:
   - 全ての公開APIメソッドが少なくとも1つのテストでカバーされている
   - 全ての主要フェーズ遷移パターンがテストされている
   - 全てのレギュレーション適用ケースがテストされている

3. **エラー処理の完全性**:
   - 全ての想定されるエラーケースが適切にテストされている
   - エラー回復メカニズムが検証されている

4. **パフォーマンス基準**:
   - フェーズ遷移メソッドの実行時間が許容範囲内（例: 100ms以内）
   - メモリリークがない
   - 長時間実行での安定性が確保されている

5. **統合検証**:
   - 主要なゲームシナリオが正しく動作することが検証されている
   - 異なるレギュレーション設定での一貫した動作が検証されている

## 11. まとめ

この改善版テスト設計書では、以下の点を強化しました：

1. **テスト優先度の導入**:
   - P0〜P3の優先度レベルで実装順序を明確化

2. **テスト共通データとユーティリティの定義**:
   - テストフィクスチャの共通化
   - テストヘルパー関数の設計

3. **モックの拡張**:
   - 履歴記録機能の追加
   - 状態リセット機能の定義

4. **エッジケーステストの強化**:
   - 複雑なフェーズ遷移シーケンス
   - 状態破損からの復旧処理

5. **パフォーマンステストの追加**:
   - メモリリーク検証
   - イベント処理のパフォーマンス

6. **統合シナリオテストの追加**:
   - 一連のゲーム進行を検証
   - レギュレーション適用の一貫性確認

7. **具体的な検証方法の明示**:
   - 各テストケースでの検証コード例の提示

この設計書に従ってテストを実装することで、GameManagerPhaseモジュールの品質と信頼性を高いレベルで確保できます。また、優先度付けにより、リソースやスケジュールに制約がある場合でも、重要なテストを優先的に実施できます。
 プレイヤーが3人以上追加されている
- 役職が配布されている
- ゲームが未開始状態である

**テストデータ**:
- プレイヤー: 標準テストプレイヤー4人
- 役職配布状態: true
- ゲーム状態: { isStarted: false, turn: 0 }

**テスト手順**:
1. GameManagerインスタンスを初期状態でセットアップ
2. プレイヤーと役職の配布状態を設定
3. start()メソッドを呼び出す
4. 戻り値と状態変更を検証

**期待結果**:
- true が返される
- ゲーム状態が更新される:
  - state.isStarted = true
  - state.turn = 1
- 以下のイベントが順番に発火される:
  1. "game.starting" (データ: { playerCount: 4 })
  2. "game.started" (データ: { playerCount: 4, initialPhase: [初期フェーズID] })
- PhaseManager.moveToInitialPhase が呼ばれる

**検証方法**:
- 戻り値の検証: `expect(result).toBe(true)`
- 状態の検証: `expect(gameManager.state.isStarted).toBe(true)`
- イベント発火の検証: `verifyEventEmitted(mocks.eventSystem, "game.starting", { playerCount: 4 })`
- メソッド呼び出しの検証: `expect(mocks.phaseManager.moveToInitialPhase).toHaveBeenCalled()`

---

**テスト名**: レギュレーション設定がゲーム開始に反映される [P1]

**概要**: 特定のレギュレーション（例：初日処刑なし）が設定されている状態でゲーム開始時に適切に反映されることを確認します。

**前提条件**:
- プレイヤーが追加され、役職が配布されている
- 特定のレギュレーションが設定されている
- ゲームが未開始状態である

**テストデータ**:
- プレイヤー: 標準テストプレイヤー4人
- 役職配布状態: true
- レギュレーション: { firstDayExecution: false, executionRule: 'random' }

**テスト手順**:
1. カスタムレギュレーションを設定したGameManagerインスタンスをセットアップ
2. プレイヤーと役職の配布状態を設定
3. start()メソッドを呼び出す
4. レギュレーションがPhaseManagerに伝達されているか検証

**期待結果**:
- PhaseManager.moveToInitialPhase がレギュレーション情報を含む適切なオプションで呼ばれる

**検証方法**:
- メソッド呼び出しの検証: `expect(mocks.phaseManager.moveToInitialPhase).toHaveBeenCalledWith(expect.objectContaining({ regulations: expect.objectContaining({ firstDayExecution: false, executionRule: 'random' }) }))`

---

**テスト名**: 最小プレイヤー数でもゲームが開始できる [P2]

**概要**: 最小プレイヤー数（3人）でもゲームが正常に開始できることを確認します。

**前提条件**:
- 最小プレイヤー数（3人）が追加されている
- 役職が配布されている
- ゲームが未開始状態である

**テストデータ**:
- プレイヤー: 標準テストプレイヤーの最初の3人
- 役職配布状態: true

**テスト手順**:
1. 3人のプレイヤーでGameManagerインスタンスをセットアップ
2. start()メソッドを呼び出す
3. ゲーム開始を検証

**期待結果**:
- ゲームが正常に開始される
- 警告イベントは発火されない

**検証方法**:
- 状態の検証: `expect(gameManager.state.isStarted).toBe(true)`
- 警告イベントが発火されていないことの検証: `expect(mocks.eventSystem.emit).not.toHaveBeenCalledWith("warning", expect.anything())`

#### 6.1.2 異常系のテスト

**テスト名**: ゲーム開始済みの場合にエラーとなる [P0]

**概要**: 既にゲームが開始されている状態でstart()を呼び出すとエラーが発生することを確認します。

**前提条件**:
- ゲームが開始済み状態（state.isStarted = true）

**テストデータ**:
- ゲーム状態: { isStarted: true }

**テスト手順**:
1. ゲーム状態を開始済みに設定
2. start()メソッドを呼び出す

**期待結果**:
- GAME_ALREADY_STARTED エラーがスローされる
- エラーメッセージ: "ゲームは既に開始されています"

**検証方法**:
- エラーの検証: `expect(() => gameManager.start()).toThrow(errorWithCode('GAME_ALREADY_STARTED'))`
- エラーハンドラが呼ばれたことの検証: `expect(mocks.errorHandler.handleError).toHaveBeenCalled()`

---

**テスト名**: プレイヤー数不足でエラーとなる [P0]

**概要**: プレイヤー数が不足している状態でstart()を呼び出すとエラーが発生することを確認します。

**前提条件**:
- プレイヤーが2人以下しか追加されていない

**テストデータ**:
- プレイヤー: 標準テストプレイヤーの最初の2人のみ

**テスト手順**:
1. 2人のプレイヤーでGameManagerインスタンスをセットアップ
2. start()メソッドを呼び出す

**期待結果**:
- INSUFFICIENT_PLAYERS エラーがスローされる
- エラーメッセージ: "ゲームを開始するには最低3人のプレイヤーが必要です"

**検証方法**:
- エラーの検証: `expect(() => gameManager.start()).toThrow(errorWithCode('INSUFFICIENT_PLAYERS'))`

---

**テスト名**: 役職未配布でエラーとなる [P0]

**概要**: 役職が配布されていない状態でstart()を呼び出すとエラーが発生することを確認します。

**前提条件**:
- プレイヤーは追加されているが役職が配布されていない

**テストデータ**:
- プレイヤー: 標準テストプレイヤー4人
- 役職配布状態: false

**テスト手順**:
1. 役職未配布状態のGameManagerインスタンスをセットアップ
2. start()メソッドを呼び出す

**期待結果**:
- ROLES_NOT_DISTRIBUTED エラーがスローされる
- エラーメッセージ: "役職が配布されていません"

**検証方法**:
- エラーの検証: `expect(() => gameManager.start()).toThrow(errorWithCode('ROLES_NOT_DISTRIBUTED'))`

### 6.2 `nextPhase()` メソッドのテスト

#### 6.2.1 正常系のテスト

**テスト名**: 基本的なフェーズ遷移が正常に行われる [P0]

**概要**: 現在のフェーズから次のフェーズへの遷移が正常に行われることを確認します。

**前提条件**:
- ゲームが開始されている
- 現在のフェーズが昼フェーズである

**テストデータ**:
- 現在のフェーズ: { id: "day", displayName: "昼フェーズ" }
- 次のフェーズ: { id: "vote", displayName: "投票フェーズ" }
- ゲーム状態: { isStarted: true, isEnded: false, turn: 1 }

**テスト手順**:
1. ゲーム開始状態のGameManagerインスタンスをセットアップ
2. 現在のフェーズを昼フェーズに設定
3. PhaseManager.moveToNextPhaseの戻り値を投票フェーズに設定
4. nextPhase()メソッドを呼び出す
5. フェーズ遷移の結果を検証

**期待結果**:
- PhaseManager.moveToNextPhase が呼ばれる
- 「phase.transition.before」イベントが発火される
  - データ: { fromPhase: { id: "day" }, toPhaseId: "vote" }
- 「phase.transition.after」イベントが発火される
  - データ: { fromPhase: { id: "day" }, toPhase: { id: "vote" } }
- フェーズ固有のハンドラメソッド（handleVotePhaseStart）が呼ばれる
- 投票フェーズの情報が返される

**検証方法**:
- 戻り値の検証: `expect(result).toEqual(expect.objectContaining({ id: "vote" }))`
- メソッド呼び出しの検証: `expect(mocks.phaseManager.moveToNextPhase).toHaveBeenCalled()`
- イベント発火の検証: `verifyEventEmitted(mocks.eventSystem, "phase.transition.before", expect.objectContaining({ fromPhase: expect.objectContaining({ id: "day" }) }))`

---

**テスト名**: ターン進行を伴うフェーズ遷移 [P1]

**概要**: フェーズ遷移でターン数が増加するケースが正常に処理されることを確認します。

**前提条件**:
- ゲームが開始されている
- 現在のフェーズが処刑フェーズである

**テストデータ**:
- 現在のフェーズ: { id: "execution", displayName: "処刑フェーズ" }
- 次のフェーズ: { id: "night", displayName: "夜フェーズ", newTurn: true }
- ゲーム状態: { isStarted: true, isEnded: false, turn: 1 }

**テスト手順**:
1. ゲーム開始状態のGameManagerインスタンスをセットアップ
2. 現在のフェーズを処刑フェーズに設定
3. PhaseManager.moveToNextPhaseの戻り値を夜フェーズに設定（newTurn: true）
4. nextPhase()メソッドを呼び出す
5. ターン進行を検証

**期待結果**:
- ターン数が1から2に増加する
- 「turn.new」イベントが発火される
  - データ: { turn: 2 }
- 状態が正しく更新される（state.turn = 2）

**検証方法**:
- 状態の検証: `expect(gameManager.state.turn).toBe(2)`
- イベント発火の検証: `verifyEventEmitted(mocks.eventSystem, "turn.new", { turn: 2 })`

---

**テスト名**: 初日処刑なしルールが適用される [P1]

**概要**: 初日処刑なしレギュレーションが設定されている場合に、初日昼から投票をスキップして夜に移行することを確認します。

**前提条件**:
- 初日処刑なしレギュレーションが設定されている
- 現在が初日昼フェーズである

**テストデータ**:
- レギュレーション: { firstDayExecution: false }
- 現在のフェーズ: { id: "day", displayName: "昼フェーズ" }
- ゲーム状態: { isStarted: true, isEnded: false, turn: 1 }

**テスト手順**:
1. 初日処刑なしレギュレーションを設定したGameManagerインスタンスをセットアップ
2. 現在のフェーズを初日昼フェーズに設定
3. handleDayPhaseStartが初日処刑なしの特殊処理を実行するようモックを設定
4. nextPhase()メソッドを呼び出す
5. フェーズ遷移を検証

**期待結果**:
- 「firstDay.noExecution」イベントが発火される
- 投票フェーズをスキップして夜フェーズに移行する
- PhaseManager.moveToPhase が 'night' パラメータで呼ばれる

**検証方法**:
- イベント発火の検証: `verifyEventEmitted(mocks.eventSystem, "firstDay.noExecution", expect.anything())`
- メソッド呼び出しの検証: `expect(mocks.phaseManager.moveToPhase).toHaveBeenCalledWith("night", expect.anything())`

---

**テスト名**: 勝利条件達成時にゲーム終了フェーズに移行する [P1]

**概要**: フェーズ遷移中に勝利条件が達成された場合にゲーム終了フェーズに移行することを確認します。

**前提条件**:
- ゲームが進行中である
- 勝利条件が達成される状態にある

**テストデータ**:
- 現在のフェーズ: { id: "execution", displayName: "処刑フェーズ" }
- ゲーム状態: { isStarted: true, isEnded: false, turn: 2 }
- 勝利情報: { team: "village", reason: "人狼全滅", winningPlayers: [0, 1, 2] }

**テスト手順**:
1. ゲーム進行中のGameManagerインスタンスをセットアップ
2. VictoryManager.isGameEndをtrueを返すよう設定
3. VictoryManager.getWinnerを勝利情報を返すよう設定
4. nextPhase()メソッドを呼び出す
5. ゲーム終了処理を検証

**期待結果**:
- PhaseManager.moveToPhase が 'gameEnd' パラメータで呼ばれる
- ゲーム状態が終了状態に更新される（state.isEnded = true）
- 勝者情報が設定される（state.winner = "village"）
- 「game.end」イベントが発火される
  - データ: { winner: "village", reason: "人狼全滅", winningPlayers: [0, 1, 2] }

**検証方法**:
- メソッド呼び出しの検証: `expect(mocks.phaseManager.moveToPhase).toHaveBeenCalledWith("gameEnd", expect.anything())`
- 状態の検証: `expect(gameManager.state.isEnded).toBe(true)`
- イベント発火の検証: `verifyEventEmitted(mocks.eventSystem, "game.end", expect.objectContaining({ winner: "village" }))`

#### 6.2.2 異常系のテスト

**テスト名**: ゲーム未開始状態でエラーとなる [P0]

**概要**: ゲームが開始されていない状態でnextPhase()を呼び出すとエラーが発生することを確認します。

**前提条件**:
- ゲームが未開始状態（state.isStarted = false）

**テストデータ**:
- ゲーム状態: { isStarted: false }

**テスト手順**:
1. ゲーム未開始状態のGameManagerインスタンスをセットアップ
2. nextPhase()メソッドを呼び出す

**期待結果**:
- GAME_NOT_STARTED エラーがスローされる
- エラーメッセージ: "ゲームが開始されていません"

**検証方法**:
- エラーの検証: `expect(() => gameManager.nextPhase()).toThrow(errorWithCode('GAME_NOT_STARTED'))`

---

**テスト名**: フェーズ遷移中のエラー回復処理 [P2]

**概要**: フェーズ遷移中にエラーが発生した場合の回復処理が適切に行われることを確認します。

**前提条件**:
- ゲームが開始されている
- PhaseManager.moveToNextPhaseがエラーをスローするよう設定

**テストデータ**:
- 現在のフェーズ: { id: "day", displayName: "昼フェーズ" }
- ゲーム状態: { isStarted: true, isEnded: false, turn: 1 }
- スローされるエラー: new Error("フェーズ遷移エラー")

**テスト手順**:
1. ゲーム開始状態のGameManagerインスタンスをセットアップ
2. PhaseManager.moveToNextPhaseがエラーをスローするよう設定
3. try-catchブロックでnextPhase()メソッドを呼び出す
4. エラー処理の検証

**期待結果**:
- ErrorHandler.handleError が呼ばれる
- エラーが適切に伝播される
- ゲーム状態の一貫性が維持される

**検証方法**:
- エラーの検証: `expect(() => gameManager.nextPhase()).toThrow()`
- エラーハンドラの呼び出し検証: `expect(mocks.errorHandler.handleError).toHaveBeenCalled()`
- 状態の一貫性検証: ゲーム状態が変更されていないことを確認

### 6.3 フェーズ情報取得メソッドのテスト

**テスト名**: getCurrentPhase が正しいフェーズ情報を返す [P0]

**概要**: getCurrentPhase()メソッドが現在のフェーズ情報を正しく返すことを確認します。

**前提条件**:
- ゲームが開始されている
- 現在のフェーズが設定されている

**テストデータ**:
- 現在のフェーズ: { id: "night", displayName: "夜フェーズ" }
- ゲーム状態: { isStarted: true, turn: 1 }

**テスト手順**:
1. ゲーム開始状態のGameManagerインスタンスをセットアップ
2. PhaseManager.getCurrentPhaseが夜フェーズを返すよう設定
3. getCurrentPhase()を呼び出す
4. 戻り値を検証

**期待結果**:
- 夜フェーズオブジェクトが返される

**検証方法**:
- 戻り値の検証: `expect(result).toEqual({ id: "night", displayName: "夜フェーズ" })`
- PhaseManagerのメソッド呼び出し検証: `expect(mocks.phaseManager.getCurrentPhase).toHaveBeenCalled()`

---

**テスト名**: ゲーム未開始時のgetCurrentPhaseはエラーとなる [P1]

**概要**: ゲームが開始されていない状態でgetCurrentPhase()を呼び出すとエラーが発生することを確認します。

**前提条件**:
- ゲームが未開始状態（state.isStarted = false）

**テストデータ**:
- ゲーム状態: { isStarted: false }

**テスト手順**:
1. ゲーム未開始状態のGameManagerインスタンスをセットアップ
2. getCurrentPhase()メソッドを呼び出す

**期待結果**:
- GAME_NOT_STARTED エラーがスローされる

**検証方法**:
- エラーの検証: `expect(() => gameManager.getCurrentPhase()).toThrow(errorWithCode('GAME_NOT_STARTED'))`

## 7. エッジケースとパフォーマンステスト

### 7.1 エッジケーステスト

**テスト名**: 複雑なフェーズ遷移シーケンスの処理 [P2]

**概要**: 複数のフェーズを連続して遷移させ、状態やイベント発火が一貫して正しく処理されることを確認します。

**前提条件**:
-