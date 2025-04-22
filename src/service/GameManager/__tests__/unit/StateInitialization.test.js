/**
 * GameManagerState 初期化とリセット機能テスト
 * 
 * このテストでは、GameManagerStateの状態初期化と
 * リセット機能を検証します。
 */

// モックと共通ユーティリティのインポート
import MockFactory from '../shared/MockFactory';
import TestFixtures from '../shared/TestFixtures';
import TestHelpers from '../shared/TestHelpers';

// GameManagerStateのMix-in定義
const GameManagerStateMixin = (GameManager) => {
  // 初期状態の設定と状態管理機能の追加
  GameManager.prototype.initializeState = function(initialState = {}) {
    this.state = {
      // デフォルトの初期状態
      id: `game-${Date.now()}`,
      isStarted: false,
      isEnded: false,
      winner: null,
      winningPlayers: [],
      turn: 0,
      phase: null,
      players: [],
      roles: {
        list: [],
        distributed: false,
        distribution: {}
      },
      votes: {
        current: [],
        history: []
      },
      actions: {
        pending: [],
        history: []
      },
      history: [],
      lastUpdate: Date.now(),
      lastDeath: null,
      // 初期状態のオーバーライド
      ...initialState
    };
    
    // 変更履歴の初期化
    this.stateChanges = [];
    
    // 状態初期化イベントの発火
    this.eventSystem.emit('state.initialized', {
      state: this.state,
      timestamp: Date.now()
    });
    
    return this.state;
  };
  
  // 現在の状態を取得
  GameManager.prototype.getCurrentState = function(options = {}) {
    // デフォルトオプション
    const { includeHistory = false, includeDetails = true } = options;
    
    // 状態のディープコピーを作成
    const stateCopy = JSON.parse(JSON.stringify(this.state));
    
    // オプションに基づいて情報をフィルタリング
    if (!includeHistory) {
      stateCopy.history = [];
      stateCopy.votes.history = [];
      stateCopy.actions.history = [];
    }
    
    if (!includeDetails) {
      // 詳細情報を削除
      delete stateCopy.roles.distribution;
      delete stateCopy.votes.current;
      delete stateCopy.actions.pending;
    }
    
    return stateCopy;
  };
  
  // 状態のリセット
  GameManager.prototype.resetState = function() {
    // リセット前の状態を保存
    const previousState = JSON.parse(JSON.stringify(this.state));
    
    // リセット前イベントの発火
    this.eventSystem.emit('state.reset.before', {
      currentState: previousState
    });
    
    // 状態の初期化
    this.initializeState();
    
    // リセット後イベントの発火
    this.eventSystem.emit('state.reset.after', {
      previousState,
      currentState: this.state
    });
    
    return this.state;
  };
  
  // 状態の更新（シンプルな実装）
  GameManager.prototype.updateState = function(partialState, options = {}) {
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
    
    // 状態を更新（簡易マージ実装）
    this.state = {
      ...this.state,
      ...partialState,
      lastUpdate: Date.now()
    };
    
    // 更新履歴に追加
    this.stateChanges.push({
      timestamp: Date.now(),
      updates: partialState
    });
    
    // 更新後イベント発火（silentでない場合）
    if (!silent) {
      this.eventSystem.emit('state.update.after', {
        previousState,
        currentState: this.state,
        updates: partialState
      });
    }
    
    return this.state;
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
      this.state = null;
      this.stateChanges = [];
      this.options = {
        regulations: {},
        visibilityControl: { enabled: false }
      };
    }
  };
  
  // Mixinの適用
  GameManagerStateMixin(GameManager);
  gameManager = new GameManager();
  
  // 状態の初期化
  gameManager.initializeState();
});

afterEach(() => {
  // テスト用のTimerを元に戻す
  jest.useRealTimers();
});

describe('GameManagerState 初期化機能', () => {
  
  test('状態が正しく初期化される', () => {
    // 状態構造の検証
    expect(gameManager.state).toBeDefined();
    expect(gameManager.state.id).toMatch(/^game-\d+$/);
    expect(gameManager.state.isStarted).toBe(false);
    expect(gameManager.state.isEnded).toBe(false);
    expect(gameManager.state.turn).toBe(0);
    expect(gameManager.state.phase).toBeNull();
    
    // 初期化イベント発火の検証
    expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
      'state.initialized',
      expect.objectContaining({
        state: expect.any(Object),
        timestamp: expect.any(Number)
      })
    );
  });
  
  test('カスタム初期状態で初期化できる', () => {
    // カスタム初期状態
    const customInitialState = {
      id: 'custom-game-123',
      turn: 1,
      phase: 'night',
      isStarted: true,
      players: [
        { id: 0, name: 'テストプレイヤー1', isAlive: true },
        { id: 1, name: 'テストプレイヤー2', isAlive: true }
      ]
    };
    
    // カスタム状態で初期化
    gameManager.initializeState(customInitialState);
    
    // カスタム値が適用されていることを検証
    expect(gameManager.state.id).toBe('custom-game-123');
    expect(gameManager.state.turn).toBe(1);
    expect(gameManager.state.phase).toBe('night');
    expect(gameManager.state.isStarted).toBe(true);
    expect(gameManager.state.players).toHaveLength(2);
    expect(gameManager.state.players[0].name).toBe('テストプレイヤー1');
    
    // デフォルト値も維持されていることを検証
    expect(gameManager.state.isEnded).toBe(false);
    expect(gameManager.state.winner).toBeNull();
    expect(gameManager.state.roles).toBeDefined();
    expect(gameManager.state.votes).toBeDefined();
    expect(gameManager.state.actions).toBeDefined();
  });
  
  test('TestFixturesの初期状態を使用して初期化できる', () => {
    // TestFixturesの初期状態を使用
    gameManager.initializeState(TestFixtures.initialState);
    
    // 状態が正しく適用されているか検証
    expect(gameManager.state.id).toBe(TestFixtures.initialState.id);
    expect(gameManager.state.lastUpdate).not.toBe(TestFixtures.initialState.lastUpdate);
    
    // ディープイコールではなく、基本構造の検証
    expect(TestHelpers.validateStateStructure(gameManager.state, [
      'id', 'isStarted', 'isEnded', 'turn', 'phase', 'players', 'roles'
    ])).toBe(true);
  });
  
  test('getCurrentState が正しい状態オブジェクトを返す', () => {
    // テスト用の状態を設定
    gameManager.initializeState(TestFixtures.progressGameState);
    
    // 基本的な状態取得（すべての情報を含む）
    const fullState = gameManager.getCurrentState();
    
    // 返却される状態が元の状態と同じ構造を持つことを検証
    expect(fullState).toEqual(gameManager.state);
    
    // 参照ではなくコピーであることを検証
    expect(fullState).not.toBe(gameManager.state);
    
    // 履歴を除外した状態取得
    const stateWithoutHistory = gameManager.getCurrentState({ includeHistory: false });
    
    // 履歴が除外されていることを検証
    expect(stateWithoutHistory.history).toEqual([]);
    expect(stateWithoutHistory.votes.history).toEqual([]);
    expect(stateWithoutHistory.actions.history).toEqual([]);
    
    // 詳細を除外した状態取得
    const stateWithoutDetails = gameManager.getCurrentState({ includeDetails: false });
    
    // 詳細情報が除外されていることを検証
    expect(stateWithoutDetails.roles.distribution).toBeUndefined();
    expect(stateWithoutDetails.votes.current).toBeUndefined();
    expect(stateWithoutDetails.actions.pending).toBeUndefined();
  });
});

describe('GameManagerState リセット機能', () => {
  
  test('状態を初期状態にリセットできる', () => {
    // 状態を変更
    gameManager.updateState({
      turn: 3,
      phase: 'day',
      isStarted: true,
      players: [
        { id: 0, name: 'プレイヤー1', isAlive: true },
        { id: 1, name: 'プレイヤー2', isAlive: false }
      ]
    });
    
    // 状態が変更されていることを確認
    expect(gameManager.state.turn).toBe(3);
    expect(gameManager.state.phase).toBe('day');
    expect(gameManager.state.isStarted).toBe(true);
    
    // 状態をリセット
    const resetState = gameManager.resetState();
    
    // リセット後の状態を検証
    expect(resetState.turn).toBe(0);
    expect(resetState.phase).toBeNull();
    expect(resetState.isStarted).toBe(false);
    expect(resetState.players).toEqual([]);
    
    // リセット前イベントが発火されたことを検証
    expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
      'state.reset.before',
      expect.objectContaining({
        currentState: expect.any(Object)
      })
    );
    
    // リセット後イベントが発火されたことを検証
    expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
      'state.reset.after',
      expect.objectContaining({
        previousState: expect.any(Object),
        currentState: expect.any(Object)
      })
    );
  });
  
  test('複雑な状態からのリセットが正しく動作する', () => {
    // 複雑な状態を設定
    gameManager.initializeState(TestFixtures.complexNestedState);
    
    // 状態をリセット
    gameManager.resetState();
    
    // リセット後の状態が初期状態に戻っていることを検証
    expect(gameManager.state.isStarted).toBe(false);
    expect(gameManager.state.turn).toBe(0);
    expect(gameManager.state.regulations).toBeUndefined();
    expect(gameManager.state.options).toBeUndefined();
    
    // 構造が正しいことを検証
    expect(TestHelpers.validateStateStructure(gameManager.state, [
      'id', 'isStarted', 'isEnded', 'turn', 'phase', 'players', 'roles'
    ])).toBe(true);
  });
  
  test('リセット時のイベント発火順序が正しい', () => {
    // イベント監視のクリア
    mocks.eventSystem.emit.mockClear();
    
    // リセット実行
    gameManager.resetState();
    
    // イベント発火の呼び出しを取得
    const eventCalls = mocks.eventSystem.emit.mock.calls.map(call => call[0]);
    
    // 発火順序の検証
    expect(eventCalls).toContain('state.reset.before');
    expect(eventCalls).toContain('state.initialized');
    expect(eventCalls).toContain('state.reset.after');
    
    // 正しい順序で発火されていることを検証
    const beforeIndex = eventCalls.indexOf('state.reset.before');
    const initializedIndex = eventCalls.indexOf('state.initialized');
    const afterIndex = eventCalls.indexOf('state.reset.after');
    
    expect(beforeIndex).toBeLessThan(initializedIndex);
    expect(initializedIndex).toBeLessThan(afterIndex);
  });
  
  test('リセット後のイベントデータが正しい', () => {
    // テスト用の状態を設定
    gameManager.initializeState(TestFixtures.startedGameState);
    
    // イベント監視のクリア
    mocks.eventSystem.emit.mockClear();
    
    // リセット実行
    gameManager.resetState();
    
    // リセット後イベントの検証
    const resetAfterCall = mocks.eventSystem.emit.mock.calls.find(
      call => call[0] === 'state.reset.after'
    );
    
    expect(resetAfterCall).toBeDefined();
    
    // イベントデータの検証
    const eventData = resetAfterCall[1];
    expect(eventData).toHaveProperty('previousState');
    expect(eventData).toHaveProperty('currentState');
    expect(eventData.previousState.id).toBe(TestFixtures.startedGameState.id);
    expect(eventData.previousState.isStarted).toBe(true);
    expect(eventData.currentState.isStarted).toBe(false);
    expect(eventData.currentState.turn).toBe(0);
  });
});

describe('簡易的な状態更新機能', () => {
  test('updateState が基本的な状態更新を正しく行う', () => {
    // 更新前の状態を保存
    const initialState = { ...gameManager.state };
    
    // 状態の更新
    const updates = { turn: 1, phase: 'night', isStarted: true };
    gameManager.updateState(updates);
    
    // 更新が反映されていることを検証
    expect(gameManager.state.turn).toBe(1);
    expect(gameManager.state.phase).toBe('night');
    expect(gameManager.state.isStarted).toBe(true);
    
    // lastUpdateが更新されていることを検証
    expect(gameManager.state.lastUpdate).not.toBe(initialState.lastUpdate);
    
    // 未更新フィールドが変更されていないことを検証
    expect(gameManager.state.isEnded).toBe(initialState.isEnded);
    expect(gameManager.state.winner).toBe(initialState.winner);
  });
  
  test('更新時のイベント発火が正しく行われる', () => {
    // イベント監視のクリア
    mocks.eventSystem.emit.mockClear();
    
    // 状態の更新
    gameManager.updateState({ turn: 1 });
    
    // イベント発火の検証
    expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
      'state.update.before',
      expect.objectContaining({
        currentState: expect.any(Object),
        updates: { turn: 1 }
      })
    );
    
    expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
      'state.update.after',
      expect.objectContaining({
        previousState: expect.any(Object),
        currentState: expect.any(Object),
        updates: { turn: 1 }
      })
    );
  });
  
  test('silent オプションでイベント発火を抑制できる', () => {
    // イベント監視のクリア
    mocks.eventSystem.emit.mockClear();
    
    // サイレントモードで状態更新
    gameManager.updateState({ turn: 1 }, { silent: true });
    
    // 更新前/後イベントが発火されていないことを確認
    const updateEvents = mocks.eventSystem.emit.mock.calls.filter(
      call => call[0] === 'state.update.before' || call[0] === 'state.update.after'
    );
    
    expect(updateEvents).toHaveLength(0);
    
    // 更新自体は反映されていることを確認
    expect(gameManager.state.turn).toBe(1);
  });
  
  test('更新履歴が正しく記録される', () => {
    // 初期状態での更新履歴
    expect(gameManager.stateChanges).toHaveLength(0);
    
    // 複数回の更新
    gameManager.updateState({ turn: 1 });
    gameManager.updateState({ phase: 'night' });
    gameManager.updateState({ isStarted: true });
    
    // 更新履歴のチェック
    expect(gameManager.stateChanges).toHaveLength(3);
    expect(gameManager.stateChanges[0].updates).toEqual({ turn: 1 });
    expect(gameManager.stateChanges[1].updates).toEqual({ phase: 'night' });
    expect(gameManager.stateChanges[2].updates).toEqual({ isStarted: true });
    
    // タイムスタンプが記録されていることを確認
    gameManager.stateChanges.forEach(change => {
      expect(change.timestamp).toBeDefined();
    });
  });
});
