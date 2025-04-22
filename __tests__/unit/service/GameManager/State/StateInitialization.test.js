/**
 * GameManagerState 初期化機能テスト
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
    const { includeHistory = false, includeDetails = true } = options;

    // 現在の状態をコピー
    const state = { ...this.state };

    // オプションに基づいて履歴情報を調整
    if (!includeHistory) {
      state.history = [];
      state.events = [];
    }

    // 詳細情報の除外
    if (!includeDetails) {
      delete state.actions;
      delete state.votes;
    }

    // タイムスタンプの更新
    state.lastUpdate = Date.now();

    return state;
  };

  GameManager.prototype.getGameSummary = function () {
    const state = this.getCurrentState();

    // アクティブなプレイヤー数カウント
    const alivePlayers = this.playerManager.getAlivePlayers();

    return {
      id: state.id,
      isStarted: state.isStarted,
      isEnded: state.isEnded,
      turn: state.turn,
      phase: state.phase,
      players: {
        total: state.players.length,
        alive: alivePlayers.length
      },
      teams: this.calculateTeams(),
      winner: state.winner,
      turnsSummary: state.history.length > 0 ? `${state.history.length}ターン経過` : '開始前'
    };
  };

  GameManager.prototype.calculateTeams = function () {
    // テスト用のダミー実装
    return {
      village: 2,
      werewolf: 1
    };
  };

  GameManager.prototype.isGameStarted = function () {
    // this.state が null や undefined の場合も考慮
    return this.state?.isStarted === true;
  };

  GameManager.prototype.isGameEnded = function () {
    // this.state が null や undefined の場合も考慮
    return this.state?.isEnded === true;
  };

  GameManager.prototype.resetState = function () {
    const previousState = this.state ? { ...this.state } : null;
    // リセット前イベント発火
    this.eventSystem.emit('state.reset.before', {
      previousState, // previousStateを渡すように修正
      timestamp: Date.now() // タイムスタンプを追加
    });

    // 初期状態へリセット（this.stateを参照しないように修正）
    this.state = {
      id: this.state?.id || `game-${Date.now()}`, // IDは可能なら維持
      isStarted: false,
      isEnded: false,
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
      winner: null,
      winningPlayers: [],
      winReason: null,
      regulations: {},
      options: {},
      startTime: null,
      endTime: null,
      lastUpdate: Date.now(),
      history: [],
      events: [],
      lastDeath: null
    };

    // リセット後イベント発火
    this.eventSystem.emit('state.reset.after', {
      previousState,
      currentState: this.state
    });

    return this.state;
  };

  GameManager.prototype.updateState = function (partialState, options = {}) {
    const { silent = false, validate = true } = options;

    // 更新前の状態を保存
    const previousState = { ...this.state };

    // 更新前イベント発火（silentでない場合）
    if (!silent) {
      this.eventSystem.emit('state.update.before', {
        currentState: previousState,
        updates: partialState,
        source: options.source
      });
    }

    // 状態の更新（浅いマージ）
    this.state = {
      ...this.state,
      ...partialState,
      lastUpdate: Date.now()
    };

    // 更新後イベント発火（silentでない場合）
    if (!silent) {
      this.eventSystem.emit('state.update.after', {
        previousState,
        currentState: this.state,
        updates: partialState
      });
    }

    // トランザクション中の場合は変更を記録
    if (this.transaction && this.transaction.active) {
      this.recordTransactionChange('update', { partialState, previousState });
    }

    return this.state;
  };
};

// テスト前の準備
let gameManager;
let mocks;

beforeEach(() => {
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
      this.state = { ...TestFixtures.initialState };
      this.options = {
        regulations: {},
        visibilityControl: { enabled: false }
      };

      // トランザクション状態
      this.transaction = {
        active: false,
        snapshot: null,
        changes: [],
        timestamp: null
      };
    }
  };

  // Mixinの適用
  GameManagerStateMixin(GameManager);
  gameManager = new GameManager();
});

describe('GameManagerState 初期化機能', () => {

  describe('初期状態とリセット', () => {
    test('初期状態が正しく設定される', () => {
      // 初期状態の取得
      const state = gameManager.getCurrentState();

      // 初期状態の検証
      expect(state.isStarted).toBe(false);
      expect(state.isEnded).toBe(false);
      expect(state.turn).toBe(0);
      expect(state.phase).toBeNull();
      expect(state.players).toEqual([]);
      expect(state.roles.distributed).toBe(false);
    });

    test('基本的な状態オブジェクトの構造が正しい', () => {
      const state = gameManager.getCurrentState();

      // 構造の検証
      expect(TestHelpers.validateStateStructure(state)).toBe(true);

      // 必須フィールドの検証
      expect(state).toHaveProperty('id');
      expect(state).toHaveProperty('isStarted');
      expect(state).toHaveProperty('isEnded');
      expect(state).toHaveProperty('turn');
      expect(state).toHaveProperty('players');
      expect(state).toHaveProperty('roles');
      expect(state).toHaveProperty('votes');
      expect(state).toHaveProperty('actions');
      expect(state).toHaveProperty('lastUpdate');

      // ネスト構造の検証
      expect(state.roles).toHaveProperty('list');
      expect(state.roles).toHaveProperty('distributed');
      expect(state.roles).toHaveProperty('distribution');
      expect(state.votes).toHaveProperty('current');
      expect(state.votes).toHaveProperty('history');
      expect(state.actions).toHaveProperty('pending');
      expect(state.actions).toHaveProperty('history');
    });

    test('状態リセットが正しく動作する', () => {
      // 初期状態を変更
      gameManager.updateState({
        isStarted: true,
        turn: 3,
        phase: 'night',
        players: [{ id: 0, name: 'テストプレイヤー' }],
        testField: 'テスト値'
      });

      // リセットを実行
      const resetState = gameManager.resetState();

      // リセット後の状態を検証
      expect(resetState.isStarted).toBe(false);
      expect(resetState.isEnded).toBe(false);
      expect(resetState.turn).toBe(0);
      expect(resetState.phase).toBeNull();
      expect(resetState.players).toEqual([]);
      expect(resetState).not.toHaveProperty('testField');
    });

    test('リセット時に正しいイベントが発火される', () => {
      // リセットを実行
      gameManager.resetState();

      // イベント発火の検証
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.reset.before',
        expect.objectContaining({
          previousState: expect.any(Object)
        })
      );

      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.reset.after',
        expect.objectContaining({
          previousState: expect.any(Object),
          currentState: expect.any(Object)
        })
      );
    });
  });

  describe('ゲーム状態クエリ', () => {
    test('isGameStarted が正しく動作する', () => {
      // 初期状態（未開始）
      expect(gameManager.isGameStarted()).toBe(false);

      // 開始状態に変更
      gameManager.updateState({ isStarted: true });

      // 開始状態の確認
      expect(gameManager.isGameStarted()).toBe(true);
    });

    test('isGameEnded が正しく動作する', () => {
      // 初期状態（未終了）
      expect(gameManager.isGameEnded()).toBe(false);

      // 終了状態に変更
      gameManager.updateState({ isEnded: true });

      // 終了状態の確認
      expect(gameManager.isGameEnded()).toBe(true);
    });

    test('getCurrentState がオプションに応じて適切な情報を返す', () => {
      // テスト用データを設定
      gameManager.updateState({
        isStarted: true,
        turn: 2,
        phase: 'night',
        history: [
          { turn: 1, phase: 'preparation', events: [] },
          { turn: 1, phase: 'night', events: [] },
          { turn: 2, phase: 'day', events: [] }
        ],
        events: [
          { type: 'playerDeath', turn: 1, playerId: 0 }
        ]
      });

      // 履歴を含める場合
      const stateWithHistory = gameManager.getCurrentState({ includeHistory: true });
      expect(stateWithHistory.history.length).toBeGreaterThan(0);
      expect(stateWithHistory.events.length).toBeGreaterThan(0);

      // 履歴を含めない場合
      const stateWithoutHistory = gameManager.getCurrentState({ includeHistory: false });
      expect(stateWithoutHistory.history).toEqual([]);
      expect(stateWithoutHistory.events).toEqual([]);

      // 詳細を含めない場合
      const stateWithoutDetails = gameManager.getCurrentState({ includeDetails: false });
      expect(stateWithoutDetails).not.toHaveProperty('actions');
      expect(stateWithoutDetails).not.toHaveProperty('votes');
    });

    test('getGameSummary が正しい要約情報を返す', () => {
      // テスト用の状態を設定
      gameManager.state = TestFixtures.progressGameState;

      // getPlayerManagerのモックを設定
      mocks.playerManager.getAlivePlayers.mockReturnValueOnce([
        { id: 0, role: 'villager' },
        { id: 2, role: 'werewolf' },
        { id: 3, role: 'seer' }
      ]);

      // 要約情報を取得
      const summary = gameManager.getGameSummary();

      // 要約情報の検証
      expect(summary).toHaveProperty('id');
      expect(summary).toHaveProperty('isStarted', true);
      expect(summary).toHaveProperty('turn', 3);
      expect(summary).toHaveProperty('phase', 'night');
      expect(summary).toHaveProperty('players');
      expect(summary.players).toHaveProperty('total');
      expect(summary.players).toHaveProperty('alive');
      expect(summary.players.alive).toBe(3);
      expect(summary).toHaveProperty('teams');
      expect(summary.teams).toHaveProperty('village');
      expect(summary.teams).toHaveProperty('werewolf');
      expect(summary).toHaveProperty('turnsSummary');
    });
  });

  describe('テストシナリオ', () => {
    test('初期化～リセットシナリオが正しく実行される', () => {
      // シナリオの実行
      const result = TestScenarios.initializationScenario(gameManager, mocks);

      // シナリオ結果の検証
      expect(result.initialStateValid).toBe(true);
      expect(result.stateResetSuccess).toBe(true);
      expect(result.eventsFired.length).toBeGreaterThan(0);
      expect(result.eventsFired).toContain('state.update.before');
      expect(result.eventsFired).toContain('state.update.after');
      expect(result.eventsFired).toContain('state.reset.before');
      expect(result.eventsFired).toContain('state.reset.after');
      expect(result.error).toBeUndefined();
    });
  });

  describe('エッジケースと異常系', () => {
    test('未初期化の状態からの操作が正しく動作する', () => {
      // 明示的に未定義状態を作成
      gameManager.state = undefined;

      // getCurrentStateがエラーなく動作することを確認
      expect(() => gameManager.getCurrentState()).not.toThrow();

      // resetStateがエラーなく動作することを確認
      expect(() => gameManager.resetState()).not.toThrow();
    });

    test('不正な形式の状態でも安全に処理する', () => {
      // 状態を壊す
      gameManager.state = null;

      // isGameStarted/Endedがエラーを投げずにfalseを返す
      expect(gameManager.isGameStarted()).toBe(false);
      expect(gameManager.isGameEnded()).toBe(false);

      // resetStateは新しい状態を生成する
      const resetState = gameManager.resetState();
      expect(resetState).toBeDefined();
      expect(resetState.isStarted).toBe(false);
    });

    test('特殊フィールドを持つ状態が正しく扱われる', () => {
      // 特殊な値を含む状態の作成
      gameManager.updateState({
        specialField: Symbol('unique'),
        functionField: () => { },
        nestedSpecial: {
          fn: () => { },
          regex: /test/g
        }
      });

      // 特殊フィールドを持つ状態の取得
      const state = gameManager.getCurrentState();

      // JSONシリアライズできることを確認
      expect(() => JSON.stringify(state)).not.toThrow();

      // リセット後に特殊フィールドが消えていることを確認
      const resetState = gameManager.resetState();
      expect(resetState).not.toHaveProperty('specialField');
      expect(resetState).not.toHaveProperty('functionField');
      expect(resetState).not.toHaveProperty('nestedSpecial');
    });
  });

  describe('状態の整合性検証', () => {
    test('整合性のある状態が正しく検証される', () => {
      // 整合性のある状態の設定
      gameManager.state = { ...TestFixtures.startedGameState };

      // 整合性検証
      const result = TestHelpers.checkStateConsistency(gameManager.state);

      // 検証結果のテスト
      expect(result.consistent).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('整合性のない状態が検出される', () => {
      // 整合性のない状態を設定
      gameManager.updateState({
        isEnded: true,  // 終了状態
        isStarted: false, // 開始されていない（矛盾）
        winner: null     // 勝者なし（矛盾）
      });

      // 整合性検証
      const result = TestHelpers.checkStateConsistency(gameManager.state);

      // 検証結果のテスト
      expect(result.consistent).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues).toContain('終了状態なのに開始状態になっていない');
      expect(result.issues).toContain('終了状態なのに勝者情報がない');
    });

    test('役職配布状態の整合性チェック', () => {
      // 整合性のない役職配布状態
      gameManager.updateState({
        roles: {
          list: ['villager', 'werewolf'],
          distributed: true,  // 配布済みフラグはtrue
          distribution: {}    // しかし配布情報が空（矛盾）
        }
      });

      // 整合性検証
      const result = TestHelpers.checkStateConsistency(gameManager.state);

      // 検証結果のテスト
      expect(result.consistent).toBe(false);
      expect(result.issues).toContain('役職配布済みなのに配布情報がない');
    });
  });
});
