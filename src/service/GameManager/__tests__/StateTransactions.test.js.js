/**
 * GameManagerState トランザクション機能テスト
 */

// モックと共通ユーティリティのインポート
import MockFactory from './shared/MockFactory';
import TestFixtures from './shared/TestFixtures';
import TestHelpers from './shared/TestHelpers';
import TestScenarios from './shared/TestScenarios';

// モック用のGameStateモジュール定義
const GameManagerStateMixin = (GameManager) => {
  // 現在のGameManagerクラスに状態管理機能を追加
  GameManager.prototype.getCurrentState = function (options = {}) {
    // 現在の状態をコピー
    return { ...this.state };
  };

  GameManager.prototype.updateState = function (partialState, options = {}) {
    const { silent = false } = options;

    // 更新前の状態を保存
    const previousState = JSON.parse(JSON.stringify(this.state));

    // 更新前イベント発火（silentでない場合）
    if (!silent) {
      this.eventSystem.emit('state.update.before', {
        currentState: previousState,
        updates: partialState
      });
    }

    // 検証
    if (validate) {
      const validationResult = this.validateStateUpdate(partialState);
      if (validationResult !== true) {
        const error = this.errorHandler.createError(
          'STATE_VALIDATION_FAILED',
          `状態更新の検証に失敗しました: ${validationResult.message}`,
          { updateData: partialState, validationResult }
        );
        throw error;
      }
    }

    // 状態の更新（マージ）
    this.state = this.mergeStateUpdate(this.state, partialState);

    // 更新後イベント発火（silentでない場合）
    if (!silent) {
      this.eventSystem.emit('state.update.after', {
        previousState,
        currentState: this.state,
        updates: partialState
      });
    }

    // トランザクション中の場合は変更を記録
    if (this.transaction.active) {
      this.recordTransactionChange('update', { partialState, previousState });
    }

    return this.state;
  };

  GameManager.prototype.mergeStateUpdate = function (currentState, updates) {
    // 新しい状態オブジェクトを作成（深いコピー）
    const newState = JSON.parse(JSON.stringify(currentState));

    // 各更新フィールドを処理
    for (const [key, value] of Object.entries(updates)) {
      // ネストしたオブジェクトの更新を処理
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof newState[key] === 'object' &&
        !Array.isArray(newState[key]) &&
        newState[key] !== null
      ) {
        // 再帰的にマージ
        newState[key] = this.mergeStateUpdate(newState[key], value);
      }
      // それ以外は単純に上書き
      else {
        newState[key] = value;
      }
    }

    // タイムスタンプの更新
    newState.lastUpdate = Date.now();

    return newState;
  };

  GameManager.prototype.beginTransaction = function (metadata = {}) {
    // 既にトランザクションがアクティブな場合はエラー
    if (this.transaction.active) {
      throw this.errorHandler.createError(
        'STATE_TRANSACTION_ALREADY_ACTIVE',
        'トランザクションが既に開始されています',
        { metadata }
      );
    }

    // 状態のスナップショットを作成
    this.transaction.snapshot = this.createStateSnapshot();
    this.transaction.active = true;
    this.transaction.timestamp = Date.now();
    this.transaction.changes = [];
    this.transaction.metadata = metadata;

    // トランザクション開始イベントを発火
    this.eventSystem.emit('state.transaction.begin', {
      timestamp: this.transaction.timestamp,
      metadata
    });

    return true;
  };

  GameManager.prototype.commitTransaction = function () {
    // トランザクションがアクティブでない場合はエラー
    if (!this.transaction.active) {
      throw this.errorHandler.createError(
        'STATE_NO_ACTIVE_TRANSACTION',
        'アクティブなトランザクションがありません'
      );
    }

    // コミット前イベントを発火
    this.eventSystem.emit('state.transaction.commit.before', {
      changes: this.transaction.changes,
      duration: Date.now() - this.transaction.timestamp
    });

    // 変更をコミット（実際には既に適用済み）
    const changes = [...this.transaction.changes];

    // トランザクション状態をリセット
    const metadata = { ...this.transaction.metadata };
    this.transaction.active = false;
    this.transaction.snapshot = null;
    this.transaction.changes = [];
    this.transaction.timestamp = null;
    this.transaction.metadata = {};

    // コミット後イベントを発火
    this.eventSystem.emit('state.transaction.commit.after', {
      changes,
      timestamp: Date.now(),
      metadata
    });

    return true;
  };

  GameManager.prototype.rollbackTransaction = function () {
    // トランザクションがアクティブでない場合はエラー
    if (!this.transaction.active) {
      throw this.errorHandler.createError(
        'STATE_NO_ACTIVE_TRANSACTION',
        'アクティブなトランザクションがありません'
      );
    }

    // スナップショットが存在しない場合はエラー
    if (!this.transaction.snapshot) {
      throw this.errorHandler.createError(
        'STATE_SNAPSHOT_INVALID',
        'スナップショットが無効です'
      );
    }

    // ロールバック前イベントを発火
    this.eventSystem.emit('state.transaction.rollback.before', {
      changes: this.transaction.changes,
      duration: Date.now() - this.transaction.timestamp
    });

    // 保存されたスナップショットから状態を復元
    const previousState = { ...this.state };
    this.state = JSON.parse(JSON.stringify(this.transaction.snapshot));

    // トランザクション状態をリセット
    const changes = [...this.transaction.changes];
    const metadata = { ...this.transaction.metadata };
    this.transaction.active = false;
    this.transaction.snapshot = null;
    this.transaction.changes = [];
    this.transaction.timestamp = null;
    this.transaction.metadata = {};

    // ロールバック後イベントを発火
    this.eventSystem.emit('state.transaction.rollback.after', {
      previousState,
      currentState: this.state,
      changes,
      timestamp: Date.now(),
      metadata
    });

    return true;
  };

  GameManager.prototype.isInTransaction = function () {
    return this.transaction.active === true;
  };

  GameManager.prototype.createStateSnapshot = function () {
    // 深いコピーを作成して状態のスナップショットを返す
    return JSON.parse(JSON.stringify(this.state));
  };

  GameManager.prototype.recordTransactionChange = function (type, data) {
    if (!this.transaction.active) {
      return false;
    }

    this.transaction.changes.push({
      type,
      data,
      timestamp: Date.now()
    });

    return true;
  };
};

// テスト前の準備
let gameManager;
let mocks;

beforeEach(() => {
  // テスト用のTimerをモック化
  jest.useFakeTimers();

  // モックのリセット
  jest.clearAllMocks();

  // テスト用のGameManagerインスタンス作成
  mocks = MockFactory.createMockSet();
  const GameManager = class {
    constructor() {
      this.eventSystem = mocks.eventSystem;
      this.errorHandler = mocks.errorHandler;
      this.playerManager = mocks.playerManager;
      this.roleManager = mocks.roleManager;
      this.phaseManager = mocks.phaseManager;
      this.state = JSON.parse(JSON.stringify(TestFixtures.initialState));
      this.options = {
        regulations: {},
        visibilityControl: { enabled: false }
      };

      // トランザクション状態
      this.transaction = {
        active: false,
        snapshot: null,
        changes: [],
        timestamp: null,
        metadata: {}
      };
    }
  };

  // Mixinの適用
  GameManagerStateMixin(GameManager);
  gameManager = new GameManager();

  // エラー作成のモック設定
  mocks.errorHandler.createError.mockImplementation((code, message) => {
    const error = new Error(message);
    error.code = code;
    return error;
  });
});

afterEach(() => {
  // テスト用のTimerを元に戻す
  jest.useRealTimers();
});

describe('GameManagerState トランザクション機能', () => {

  describe('トランザクション基本操作', () => {
    test('トランザクションを開始できる', () => {
      // トランザクション開始
      const result = gameManager.beginTransaction();

      // 開始結果の検証
      expect(result).toBe(true);
      expect(gameManager.transaction.active).toBe(true);
      expect(gameManager.transaction.snapshot).toBeDefined();
      expect(gameManager.transaction.changes).toEqual([]);
      expect(gameManager.transaction.timestamp).toBeDefined();
    });

    test('メタデータを指定してトランザクションを開始できる', () => {
      // メタデータ付きでトランザクション開始
      const metadata = { source: 'test', action: 'updatePhase' };
      gameManager.beginTransaction(metadata);

      // メタデータがトランザクションに保存されていることを確認
      expect(gameManager.transaction.metadata).toEqual(metadata);

      // イベント発火時にもメタデータが含まれていることを確認
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.transaction.begin',
        expect.objectContaining({ metadata })
      );
    });

    test('トランザクションを正常にコミットできる', () => {
      // トランザクション開始
      gameManager.beginTransaction();

      // 状態の更新
      gameManager.updateState({ turn: 1, phase: 'preparation' });

      // トランザクションをコミット
      const result = gameManager.commitTransaction();

      // コミット結果の検証
      expect(result).toBe(true);
      expect(gameManager.transaction.active).toBe(false);
      expect(gameManager.transaction.snapshot).toBeNull();
      expect(gameManager.transaction.changes).toEqual([]);

      // 状態が適用されていることを確認
      expect(gameManager.state.turn).toBe(1);
      expect(gameManager.state.phase).toBe('preparation');
    });

    test('トランザクションを正常にロールバックできる', () => {
      // 初期状態を保存
      const initialState = JSON.parse(JSON.stringify(gameManager.state));

      // トランザクション開始
      gameManager.beginTransaction();

      // 状態の更新
      gameManager.updateState({ turn: 2, phase: 'night' });

      // 更新が一時的に適用されていることを確認
      expect(gameManager.state.turn).toBe(2);
      expect(gameManager.state.phase).toBe('night');

      // トランザクションをロールバック
      const result = gameManager.rollbackTransaction();

      // ロールバック結果の検証
      expect(result).toBe(true);
      expect(gameManager.transaction.active).toBe(false);
      expect(gameManager.transaction.snapshot).toBeNull();
      expect(gameManager.transaction.changes).toEqual([]);

      // 状態が元に戻っていることを確認
      expect(gameManager.state.turn).toBe(initialState.turn);
      expect(gameManager.state.phase).toBe(initialState.phase);
    });

    test('isInTransaction が正しくトランザクション状態を返す', () => {
      // 初期状態（トランザクションなし）
      expect(gameManager.isInTransaction()).toBe(false);

      // トランザクション開始
      gameManager.beginTransaction();
      expect(gameManager.isInTransaction()).toBe(true);

      // トランザクションコミット
      gameManager.commitTransaction();
      expect(gameManager.isInTransaction()).toBe(false);

      // 別のトランザクション開始
      gameManager.beginTransaction();
      expect(gameManager.isInTransaction()).toBe(true);

      // トランザクションロールバック
      gameManager.rollbackTransaction();
      expect(gameManager.isInTransaction()).toBe(false);
    });
  });

  describe('トランザクション中の変更追跡', () => {
    test('トランザクション中の変更が記録される', () => {
      // トランザクション開始
      gameManager.beginTransaction();

      // 状態の更新
      gameManager.updateState({ turn: 1 });
      gameManager.updateState({ phase: 'preparation' });

      // 変更が記録されていることを確認
      expect(gameManager.transaction.changes.length).toBe(2);
      expect(gameManager.transaction.changes[0].type).toBe('update');
      expect(gameManager.transaction.changes[0].data.partialState).toEqual({ turn: 1 });
      expect(gameManager.transaction.changes[1].type).toBe('update');
      expect(gameManager.transaction.changes[1].data.partialState).toEqual({ phase: 'preparation' });
    });

    test('複雑な状態変更も正しく記録される', () => {
      // トランザクション開始
      gameManager.beginTransaction();

      // ネストした状態更新
      gameManager.updateState({
        isStarted: true,
        roles: {
          list: ['villager', 'werewolf'],
          distributed: true
        },
        players: [
          { id: 0, name: 'プレイヤー1', isAlive: true },
          { id: 1, name: 'プレイヤー2', isAlive: true }
        ]
      });

      // 変更が記録されていることを確認
      expect(gameManager.transaction.changes.length).toBe(1);
      expect(gameManager.transaction.changes[0].data.partialState).toHaveProperty('isStarted', true);
      expect(gameManager.transaction.changes[0].data.partialState).toHaveProperty('roles');
      expect(gameManager.transaction.changes[0].data.partialState).toHaveProperty('players');
    });

    test('コミット後にすべての変更がクリアされる', () => {
      // トランザクション開始
      gameManager.beginTransaction();

      // 複数の更新
      gameManager.updateState({ turn: 1 });
      gameManager.updateState({ phase: 'night' });
      gameManager.updateState({ isStarted: true });

      // コミット
      gameManager.commitTransaction();

      // 変更がクリアされていることを確認
      expect(gameManager.transaction.changes).toEqual([]);
    });
  });

  describe('トランザクションイベント', () => {
    test('トランザクション開始時に正しいイベントが発火される', () => {
      // トランザクション開始
      gameManager.beginTransaction();

      // イベント発火の検証
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.transaction.begin',
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );
    });

    test('コミット時に正しいイベントが順番に発火される', () => {
      // トランザクション開始
      gameManager.beginTransaction();

      // 更新
      gameManager.updateState({ turn: 1 });

      // イベント監視のリセット
      mocks.eventSystem.emit.mockClear();

      // コミット
      gameManager.commitTransaction();

      // イベント発火の確認
      const eventCalls = mocks.eventSystem.emit.mock.calls.map(call => call[0]);

      // コミット前イベント
      expect(eventCalls).toContain('state.transaction.commit.before');

      // コミット後イベント
      expect(eventCalls).toContain('state.transaction.commit.after');

      // 正しい順序で発火されていることを確認
      const beforeIndex = eventCalls.indexOf('state.transaction.commit.before');
      const afterIndex = eventCalls.indexOf('state.transaction.commit.after');
      expect(beforeIndex).toBeLessThan(afterIndex);
    });

    test('ロールバック時に正しいイベントが順番に発火される', () => {
      // トランザクション開始
      gameManager.beginTransaction();

      // 更新
      gameManager.updateState({ turn: 1 });

      // イベント監視のリセット
      mocks.eventSystem.emit.mockClear();

      // ロールバック
      gameManager.rollbackTransaction();

      // イベント発火の確認
      const eventCalls = mocks.eventSystem.emit.mock.calls.map(call => call[0]);

      // ロールバック前イベント
      expect(eventCalls).toContain('state.transaction.rollback.before');

      // ロールバック後イベント
      expect(eventCalls).toContain('state.transaction.rollback.after');

      // 正しい順序で発火されていることを確認
      const beforeIndex = eventCalls.indexOf('state.transaction.rollback.before');
      const afterIndex = eventCalls.indexOf('state.transaction.rollback.after');
      expect(beforeIndex).toBeLessThan(afterIndex);
    });

    test('コミット時のイベントデータが正しい', () => {
      // トランザクション開始
      gameManager.beginTransaction({ source: 'test' });

      // 更新
      gameManager.updateState({ turn: 1 });

      // コミット
      gameManager.commitTransaction();

      // コミット後イベントの検証
      const commitAfterCall = mocks.eventSystem.emit.mock.calls.find(
        call => call[0] === 'state.transaction.commit.after'
      );

      expect(commitAfterCall).toBeDefined();

      const eventData = commitAfterCall[1];
      expect(eventData).toHaveProperty('changes');
      expect(eventData).toHaveProperty('timestamp');
      expect(eventData).toHaveProperty('metadata');
      expect(eventData.metadata).toEqual({ source: 'test' });
      expect(eventData.changes.length).toBe(1);
    });
  });

  describe('トランザクション例外ケース', () => {
    test('既に開始されているトランザクションを再開始するとエラーになる', () => {
      // 1つ目のトランザクション開始
      gameManager.beginTransaction();

      // 2つ目のトランザクション開始を試みる
      expect(() => gameManager.beginTransaction()).toThrow('トランザクションが既に開始されています');
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_TRANSACTION_ALREADY_ACTIVE',
        expect.any(String),
        expect.any(Object)
      );
    });

    test('トランザクションがアクティブでない時のコミットはエラーになる', () => {
      // トランザクションなしでコミットを試みる
      expect(() => gameManager.commitTransaction()).toThrow('アクティブなトランザクションがありません');
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_NO_ACTIVE_TRANSACTION',
        expect.any(String)
      );
    });

    test('トランザクションがアクティブでない時のロールバックはエラーになる', () => {
      // トランザクションなしでロールバックを試みる
      expect(() => gameManager.rollbackTransaction()).toThrow('アクティブなトランザクションがありません');
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_NO_ACTIVE_TRANSACTION',
        expect.any(String)
      );
    });

    test('スナップショットがない場合のロールバックはエラーになる', () => {
      // トランザクションを開始するが、スナップショットを無効化
      gameManager.beginTransaction();
      gameManager.transaction.snapshot = null;

      // ロールバックを試みる
      expect(() => gameManager.rollbackTransaction()).toThrow('スナップショットが無効です');
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_SNAPSHOT_INVALID',
        expect.any(String)
      );
    });
  });

  describe('スナップショットと復元', () => {
    test('スナップショットが状態の深いコピーを作成する', () => {
      // テスト用の状態を設定
      gameManager.state = {
        ...TestFixtures.startedGameState,
        nestedObject: {
          level1: {
            level2: {
              value: 'test'
            }
          }
        }
      };

      // スナップショットを作成
      const snapshot = gameManager.createStateSnapshot();

      // スナップショットが元の状態の深いコピーであることを確認
      expect(snapshot).toEqual(gameManager.state);
      expect(snapshot).not.toBe(gameManager.state);
      expect(snapshot.nestedObject).not.toBe(gameManager.state.nestedObject);
      expect(snapshot.nestedObject.level1).not.toBe(gameManager.state.nestedObject.level1);
      expect(snapshot.nestedObject.level1.level2).not.toBe(gameManager.state.nestedObject.level1.level2);
    });

    test('複雑な状態の変更後に正しくロールバックされる', () => {
      // テスト用の複雑な状態を設定
      gameManager.state = JSON.parse(JSON.stringify(TestFixtures.progressGameState));
      const originalState = JSON.parse(JSON.stringify(gameManager.state));

      // トランザクション開始
      gameManager.beginTransaction();

      // 複雑な状態更新
      gameManager.updateState({
        turn: gameManager.state.turn + 1,
        phase: 'vote',
        players: gameManager.state.players.map(p =>
          p.id === 0 ? { ...p, isAlive: false, causeOfDeath: 'execution', deathTurn: gameManager.state.turn } : p
        ),
        votes: {
          current: [
            { voter: 2, target: 0 },
            { voter: 3, target: 0 }
          ],
          history: [
            ...gameManager.state.votes.history,
            {
              day: gameManager.state.turn,
              votes: [
                { voter: 2, target: 0 },
                { voter: 3, target: 0 }
              ],
              result: { executed: 0, count: 2 }
            }
          ]
        },
        lastDeath: { playerId: 0, cause: 'execution', turn: gameManager.state.turn }
      });

      // 変更が適用されていることを確認
      expect(gameManager.state.turn).toBe(originalState.turn + 1);
      expect(gameManager.state.phase).toBe('vote');
      expect(gameManager.state.players.find(p => p.id === 0).isAlive).toBe(false);

      // ロールバック
      gameManager.rollbackTransaction();

      // 完全に元の状態に戻っていることを確認
      expect(gameManager.state).toEqual(originalState);
    });
  });

  describe('テストシナリオ', () => {
    test('コミットを伴うトランザクションシナリオが正しく実行される', () => {
      // コミットするトランザクションシナリオを実行
      const result = TestScenarios.transactionScenario(gameManager, mocks, true);

      // シナリオ結果の検証
      expect(result.transactionStarted).toBe(true);
      expect(result.updatesApplied.length).toBe(2);
      expect(result.transactionEnded).toBe(true);
      expect(result.error).toBeUndefined();

      // 最終状態が更新されていることを確認
      expect(result.finalState.turn).toBe(2); // 元のturn + 1
      expect(result.finalState.phase).toBe('vote');
      expect(result.finalState.players.find(p => p.id === 1).isAlive).toBe(false);

      // 発火されたイベントの確認
      expect(result.events).toContain('state.transaction.begin');
      expect(result.events).toContain('state.update.before');
      expect(result.events).toContain('state.update.after');
      expect(result.events).toContain('state.transaction.commit.before');
      expect(result.events).toContain('state.transaction.commit.after');
    });

    test('ロールバックを伴うトランザクションシナリオが正しく実行される', () => {
      // ロールバックするトランザクションシナリオを実行
      const result = TestScenarios.transactionScenario(gameManager, mocks, false);

      // シナリオ結果の検証
      expect(result.transactionStarted).toBe(true);
      expect(result.updatesApplied.length).toBe(2);
      expect(result.transactionEnded).toBe(true);
      expect(result.error).toBeUndefined();

      // 最終状態が元に戻っていることを確認
      expect(result.finalState.turn).toBe(result.stateBeforeTransaction.turn);
      expect(result.finalState.phase).toBe(result.stateBeforeTransaction.phase);
      expect(result.finalState.players).toEqual(result.stateBeforeTransaction.players);

      // 発火されたイベントの確認
      expect(result.events).toContain('state.transaction.begin');
      expect(result.events).toContain('state.update.before');
      expect(result.events).toContain('state.update.after');
      expect(result.events).toContain('state.transaction.rollback.before');
      expect(result.events).toContain('state.transaction.rollback.after');
    });
  });

  describe('パフォーマンス考慮', () => {
    beforeEach(() => {
      // 大量のプレイヤーを持つ状態の設定
      gameManager.state = {
        ...TestFixtures.initialState,
        players: Array(100).fill().map((_, i) => ({
          id: i,
          name: `プレイヤー${i}`,
          isAlive: true
        }))
      };
    });

    test('大規模な状態でもトランザクションが効率的に動作する', () => {
      // 開始時間を記録
      const startTime = Date.now();

      // トランザクション開始
      gameManager.beginTransaction();

      // 大規模な更新
      for (let i = 0; i < 20; i++) {
        gameManager.updateState({
          [`field${i}`]: `value${i}`,
          players: gameManager.state.players.map((p, idx) =>
            idx % 10 === i % 10 ? { ...p, status: `status${i}` } : p
          )
        });
      }

      // コミット
      gameManager.commitTransaction();

      // 経過時間を計算
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 実装が効率的であれば、大規模データでも短時間で完了するはず
      // このテストは環境依存なので、実際のスレッショルドは調整が必要
      expect(duration).toBeLessThan(1000); // 1秒以内を期待
    });
  });
});
