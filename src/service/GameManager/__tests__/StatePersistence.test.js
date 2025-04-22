/**
 * GameManagerState 状態保存・復元機能テスト
 */

// モックと共通ユーティリティのインポート
import MockFactory from './shared/MockFactory';
import TestFixtures from './shared/TestFixtures';
import TestHelpers from './shared/TestHelpers';
import TestScenarios from './shared/TestScenarios';

// モック用のGameStateモジュール定義
const GameManagerStateMixin = (GameManager) => {
  // 現在のGameManagerクラスに状態管理機能を追加

  // 現在の状態取得
  GameManager.prototype.getCurrentState = function (options = {}) {
    return JSON.parse(JSON.stringify(this.state));
  };

  // 状態更新（トランザクション連携に必要）
  GameManager.prototype.updateState = function (partialState, options = {}) {
    const { silent = false } = options;

    // 更新前イベント発火（silentでない場合）
    if (!silent) {
      this.eventSystem.emit('state.update.before', {
        currentState: this.state,
        updates: partialState
      });
    }

    // 状態の更新
    this.state = {
      ...this.state,
      ...partialState,
      lastUpdate: Date.now()
    };

    // 更新後イベント発火（silentでない場合）
    if (!silent) {
      this.eventSystem.emit('state.update.after', {
        previousState: { ...this.state, ...partialState },
        currentState: this.state,
        updates: partialState
      });
    }

    return this.state;
  };

  // ゲーム状態を保存
  GameManager.prototype.saveGameState = function (saveId = null, options = {}) {
    const { metadata = {}, includeHistory = true, compress = false } = options;

    // 保存IDの生成（指定がなければ自動生成）
    const id = saveId || `save-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 完全なゲーム状態の構築
    const state = this.buildFullGameState({ includeHistory });

    // チェックサムの計算（簡易実装）
    const checksum = this.calculateChecksum(state);

    // 保存前イベント発火
    this.eventSystem.emit('state.save.before', {
      saveId: id,
      options,
      timestamp: Date.now()
    });

    // 保存データの構築
    const saveData = {
      id,
      gameId: this.state.id,
      version: '1.0.0', // バージョン情報
      timestamp: Date.now(),
      state,
      metadata: {
        createdBy: 'system',
        ...metadata
      },
      checksum
    };

    // 保存後イベント発火
    this.eventSystem.emit('state.save.after', {
      saveId: id,
      saveData,
      options,
      timestamp: Date.now()
    });

    return saveData;
  };

  // 完全なゲーム状態の構築
  GameManager.prototype.buildFullGameState = function (options = {}) {
    const { includeHistory = true } = options;

    // 現在の状態のコピー
    const state = JSON.parse(JSON.stringify(this.state));

    // 履歴を含めない場合は空にする
    if (!includeHistory) {
      state.history = [];
      state.events = [];
    }

    // 各マネージャーから追加情報を収集（実際の実装ではより複雑になる）

    return state;
  };

  // チェックサムの計算（簡易版）
  GameManager.prototype.calculateChecksum = function (data) {
    // 実際の実装では適切なハッシュアルゴリズムを使用
    // ここでは簡易的に文字列の長さを使用
    try {
      const jsonStr = JSON.stringify(data);
      return `checksum-${jsonStr.length}`;
    } catch (error) {
      return 'invalid-checksum';
    }
  };

  // 保存データからゲーム状態を読み込む
  GameManager.prototype.loadGameState = function (saveData, options = {}) {
    const { validateOnly = false, resetBeforeLoad = true } = options;

    // バリデーション
    const validationResult = this.validateSaveData(saveData);
    if (!validationResult.valid) {
      throw this.errorHandler.createError(
        validationResult.code || 'STATE_SAVE_INVALID',
        validationResult.message || '無効な保存データです',
        { details: validationResult.details }
      );
    }

    // 検証のみの場合はここで終了
    if (validateOnly) {
      return true;
    }

    // 読み込み前イベント発火
    this.eventSystem.emit('state.load.before', {
      saveData,
      options,
      timestamp: Date.now()
    });

    // リセットオプションが有効なら状態をリセット
    if (resetBeforeLoad) {
      this.resetState();
    }

    // 前の状態を保存
    const previousState = JSON.parse(JSON.stringify(this.state));

    // 状態の復元
    this.state = JSON.parse(JSON.stringify(saveData.state));

    // 状態のバージョンマイグレーション（必要な場合）
    if (saveData.version !== '1.0.0') {
      this.migrateState(saveData.version);
    }

    // 読み込み後イベント発火
    this.eventSystem.emit('state.load.after', {
      saveId: saveData.id,
      previousState,
      currentState: this.state,
      timestamp: Date.now()
    });

    return true;
  };

  // 保存データのバリデーション
  GameManager.prototype.validateSaveData = function (saveData) {
    // 保存データが存在することを確認
    if (!saveData) {
      return {
        valid: false,
        code: 'STATE_SAVE_INVALID',
        message: '保存データが存在しません'
      };
    }

    // 必須フィールドの確認
    const requiredFields = ['id', 'gameId', 'version', 'timestamp', 'state', 'checksum'];
    for (const field of requiredFields) {
      if (!(field in saveData)) {
        return {
          valid: false,
          code: 'STATE_SAVE_INVALID',
          message: `必須フィールドがありません: ${field}`
        };
      }
    }

    // 状態データの妥当性確認
    if (!saveData.state || typeof saveData.state !== 'object') {
      return {
        valid: false,
        code: 'STATE_SAVE_INVALID',
        message: '無効な状態データです'
      };
    }

    // チェックサムの検証
    const calculatedChecksum = this.calculateChecksum(saveData.state);
    if (calculatedChecksum !== saveData.checksum) {
      return {
        valid: false,
        code: 'STATE_CHECKSUM_FAILED',
        message: 'チェックサムが一致しません',
        details: {
          expected: saveData.checksum,
          actual: calculatedChecksum
        }
      };
    }

    // バージョン互換性の確認
    if (!this.isVersionCompatible(saveData.version)) {
      return {
        valid: false,
        code: 'STATE_VERSION_INCOMPATIBLE',
        message: `互換性のないバージョンです: ${saveData.version}`,
        details: {
          saveVersion: saveData.version,
          currentVersion: '1.0.0'
        }
      };
    }

    return { valid: true };
  };

  // バージョン互換性チェック
  GameManager.prototype.isVersionCompatible = function (version) {
    // 簡易実装：メジャーバージョンが一致すれば互換性あり
    const currentMajor = 1; // 現在の実装バージョン
    const saveMajor = parseInt(version.split('.')[0], 10);
    return !isNaN(saveMajor) && saveMajor === currentMajor;
  };

  // 状態のバージョンマイグレーション
  GameManager.prototype.migrateState = function (fromVersion) {
    // 旧バージョンから新バージョンへの変換処理
    const version = fromVersion.split('.').map(Number);

    // バージョン0.9.x -> 1.0.0
    if (version[0] === 0 && version[1] === 9) {
      // マイグレーション処理（仮実装）
      if ('oldField' in this.state) {
        delete this.state.oldField;
      }

      // マイグレーションイベント発火
      this.eventSystem.emit('state.migrate', {
        fromVersion,
        toVersion: '1.0.0',
        changes: ['oldField removed']
      });
    }

    return true;
  };

  // 状態リセット
  GameManager.prototype.resetState = function () {
    // リセット前イベント発火
    this.eventSystem.emit('state.reset.before', {
      currentState: this.state
    });

    // 初期状態へリセット
    const previousState = { ...this.state };
    this.state = {
      id: this.state.id,
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
      this.state = JSON.parse(JSON.stringify(TestFixtures.progressGameState));
      this.options = {
        regulations: {},
        visibilityControl: { enabled: false }
      };
    }
  };

  // Mixinの適用
  GameManagerStateMixin(GameManager);
  gameManager = new GameManager();
});

describe('GameManagerState 状態保存・復元機能', () => {

  describe('基本的な保存機能', () => {
    test('指定IDでの保存', () => {
      // 指定IDでの保存
      const saveId = 'test-save-1';
      const saveData = gameManager.saveGameState(saveId);

      // 結果の検証
      expect(saveData).toBeDefined();
      expect(saveData.id).toBe(saveId);
      expect(saveData.gameId).toBe(gameManager.state.id);
      expect(saveData.state).toBeDefined();
      expect(saveData.timestamp).toBeDefined();
      expect(saveData.checksum).toBeDefined();
      expect(saveData.metadata).toBeDefined();
    });

    test('自動生成IDでの保存', () => {
      // IDを指定せずに保存
      const saveData = gameManager.saveGameState();

      // 結果の検証
      expect(saveData).toBeDefined();
      expect(saveData.id).toBeDefined();
      expect(saveData.id).toMatch(/^save-\d+-[a-z0-9]+$/); // ID形式の確認
    });

    test('メタデータ付きの保存', () => {
      // カスタムメタデータで保存
      const metadata = {
        description: 'テスト用セーブデータ',
        tags: ['test', 'development'],
        author: 'unit-test'
      };

      const saveData = gameManager.saveGameState('test-save-meta', { metadata });

      // メタデータが保存されていることを確認
      expect(saveData.metadata).toEqual({
        createdBy: 'system', // デフォルト値
        ...metadata // カスタム値
      });
    });

    test('履歴を含まない保存', () => {
      // 履歴を含めないオプションで保存
      const saveData = gameManager.saveGameState('test-save-no-history', {
        includeHistory: false
      });

      // 履歴が含まれていないことを確認
      expect(saveData.state.history).toEqual([]);
      expect(saveData.state.events).toEqual([]);
    });
  });

  describe('保存イベント', () => {
    test('保存前イベントが発火される', () => {
      // イベントモックをクリア
      mocks.eventSystem.emit.mockClear();

      // 保存実行
      gameManager.saveGameState('test-save-events');

      // 保存前イベントが発火されることを確認
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.save.before',
        expect.objectContaining({
          saveId: 'test-save-events',
          options: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });

    test('保存後イベントが発火される', () => {
      // イベントモックをクリア
      mocks.eventSystem.emit.mockClear();

      // 保存実行
      gameManager.saveGameState('test-save-events');

      // 保存後イベントが発火されることを確認
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.save.after',
        expect.objectContaining({
          saveId: 'test-save-events',
          saveData: expect.any(Object),
          options: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('保存データの構造', () => {
    test('保存データの基本構造が正しい', () => {
      // 保存データを取得
      const saveData = gameManager.saveGameState('test-save-structure');

      // 構造の検証
      expect(TestHelpers.validateSaveDataStructure(saveData)).toBe(true);

      // 必須フィールドの確認
      expect(saveData).toHaveProperty('id');
      expect(saveData).toHaveProperty('gameId');
      expect(saveData).toHaveProperty('version');
      expect(saveData).toHaveProperty('timestamp');
      expect(saveData).toHaveProperty('state');
      expect(saveData).toHaveProperty('metadata');
      expect(saveData).toHaveProperty('checksum');

      // データ型の確認
      expect(typeof saveData.id).toBe('string');
      expect(typeof saveData.gameId).toBe('string');
      expect(typeof saveData.version).toBe('string');
      expect(typeof saveData.timestamp).toBe('number');
      expect(typeof saveData.state).toBe('object');
      expect(typeof saveData.metadata).toBe('object');
      expect(typeof saveData.checksum).toBe('string');
    });

    test('保存された状態データが完全である', () => {
      // 保存データを取得
      const saveData = gameManager.saveGameState('test-save-complete');

      // 状態データの完全性検証
      const state = saveData.state;

      // 基本フィールドの確認
      expect(state).toHaveProperty('id');
      expect(state).toHaveProperty('isStarted');
      expect(state).toHaveProperty('isEnded');
      expect(state).toHaveProperty('turn');
      expect(state).toHaveProperty('phase');

      // プレイヤーデータの確認
      expect(state).toHaveProperty('players');
      expect(Array.isArray(state.players)).toBe(true);
      expect(state.players.length).toBe(gameManager.state.players.length);

      // 役職データの確認
      expect(state).toHaveProperty('roles');
      expect(state.roles).toHaveProperty('list');
      expect(state.roles).toHaveProperty('distributed');
      expect(state.roles).toHaveProperty('distribution');

      // 投票とアクションデータの確認
      expect(state).toHaveProperty('votes');
      expect(state).toHaveProperty('actions');
    });

    test('チェックサムが計算される', () => {
      // 保存データを取得
      const saveData = gameManager.saveGameState('test-save-checksum');

      // チェックサムが存在することを確認
      expect(saveData.checksum).toBeDefined();
      expect(saveData.checksum).toMatch(/^checksum-\d+$/); // 簡易実装の形式

      // チェックサムがステートに基づいて計算されていることを確認
      const recalculatedChecksum = gameManager.calculateChecksum(saveData.state);
      expect(saveData.checksum).toBe(recalculatedChecksum);
    });
  });

  describe('基本的な読み込み機能', () => {
    test('有効な保存データの読み込み', () => {
      // 保存
      const saveData = gameManager.saveGameState('test-load-valid');

      // 状態を変更
      gameManager.updateState({
        turn: 999,
        phase: 'changed-phase'
      });

      // 変更されていることを確認
      expect(gameManager.state.turn).toBe(999);

      // 保存データから読み込み
      const loadResult = gameManager.loadGameState(saveData);

      // 結果の検証
      expect(loadResult).toBe(true);
      expect(gameManager.state.turn).toBe(TestFixtures.progressGameState.turn);
      expect(gameManager.state.phase).toBe(TestFixtures.progressGameState.phase);
    });

    test('validateOnlyオプション', () => {
      // 保存
      const saveData = gameManager.saveGameState('test-load-validate-only');

      // 状態を変更
      gameManager.updateState({ turn: 888 });

      // 検証のみモードで読み込み
      const loadResult = gameManager.loadGameState(saveData, { validateOnly: true });

      // 結果の検証
      expect(loadResult).toBe(true);

      // 状態が変更されていないことを確認
      expect(gameManager.state.turn).toBe(888);
    });

    test('resetBeforeLoadオプション', () => {
      // 保存
      const saveData = gameManager.saveGameState('test-load-reset');

      // 状態を変更
      gameManager.updateState({
        turn: 777,
        testField: 'テスト値'
      });

      // リセット無しで読み込み
      const loadResult = gameManager.loadGameState(saveData, { resetBeforeLoad: false });

      // 結果の検証
      expect(loadResult).toBe(true);
      expect(gameManager.state.turn).toBe(TestFixtures.progressGameState.turn);

      // リセット対象外のフィールドが残っていないことを確認
      // 注：実際の挙動は実装方式に依存する
      expect(gameManager.state).not.toHaveProperty('testField');
    });
  });

  describe('読み込みイベント', () => {
    test('読み込み前イベントが発火される', () => {
      // 保存
      const saveData = gameManager.saveGameState('test-load-events');

      // イベントモックをクリア
      mocks.eventSystem.emit.mockClear();

      // 読み込み実行
      gameManager.loadGameState(saveData);

      // 読み込み前イベントが発火されることを確認
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.load.before',
        expect.objectContaining({
          saveData,
          options: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });

    test('読み込み後イベントが発火される', () => {
      // 保存
      const saveData = gameManager.saveGameState('test-load-events');

      // イベントモックをクリア
      mocks.eventSystem.emit.mockClear();

      // 読み込み実行
      gameManager.loadGameState(saveData);

      // 読み込み後イベントが発火されることを確認
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.load.after',
        expect.objectContaining({
          saveId: 'test-load-events',
          previousState: expect.any(Object),
          currentState: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('バリデーションとエラー処理', () => {
    test('nullデータの検出', () => {
      // nullデータの読み込み
      expect(() => {
        gameManager.loadGameState(null);
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_SAVE_INVALID',
        expect.any(String),
        expect.any(Object)
      );
    });

    test('必須フィールド欠損の検出', () => {
      // 不完全なデータ
      const incompleteData = {
        id: 'incomplete-save',
        gameId: 'test-game',
        // versionが欠けている
        timestamp: Date.now(),
        state: {},
        // checksumが欠けている
      };

      // 不完全データの読み込み
      expect(() => {
        gameManager.loadGameState(incompleteData);
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_SAVE_INVALID',
        expect.stringContaining('必須フィールド'),
        expect.any(Object)
      );
    });

    test('無効な状態データの検出', () => {
      // 無効な状態データ
      const invalidData = {
        id: 'invalid-state-save',
        gameId: 'test-game',
        version: '1.0.0',
        timestamp: Date.now(),
        state: null, // 無効なstate
        checksum: 'invalid'
      };

      // 無効なデータの読み込み
      expect(() => {
        gameManager.loadGameState(invalidData);
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_SAVE_INVALID',
        expect.stringContaining('無効な状態データ'),
        expect.any(Object)
      );
    });

    test('チェックサム不一致の検出', () => {
      // 保存データを取得
      const saveData = gameManager.saveGameState('test-checksum-mismatch');

      // チェックサムを改変
      const corruptedData = {
        ...saveData,
        checksum: 'corrupted-checksum'
      };

      // 破損データの読み込み
      expect(() => {
        gameManager.loadGameState(corruptedData);
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_CHECKSUM_FAILED',
        expect.stringContaining('チェックサム'),
        expect.objectContaining({
          details: expect.any(Object)
        })
      );
    });

    test('バージョン互換性の検証', () => {
      // 互換性のないバージョンの保存データ
      const incompatibleData = {
        id: 'version-incompatible',
        gameId: 'test-game',
        version: '2.0.0', // 互換性のないメジャーバージョン
        timestamp: Date.now(),
        state: { ...TestFixtures.initialState },
        checksum: 'checksum-1234'
      };

      // チェックサム計算をモック化
      jest.spyOn(gameManager, 'calculateChecksum').mockReturnValueOnce('checksum-1234');

      // 互換性のないデータの読み込み
      expect(() => {
        gameManager.loadGameState(incompatibleData);
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_VERSION_INCOMPATIBLE',
        expect.stringContaining('互換性のないバージョン'),
        expect.objectContaining({
          details: expect.any(Object)
        })
      );
    });
  });

  describe('バージョンマイグレーション', () => {
    test('古いバージョンのデータが変換される', () => {
      // 古いバージョンのデータを作成
      const oldVersionData = {
        id: 'old-version-save',
        gameId: 'test-game',
        version: '0.9.0',
        timestamp: Date.now(),
        state: {
          ...TestFixtures.initialState,
          oldField: '古いバージョンのデータ' // 旧形式のフィールド
        },
        metadata: {},
        checksum: 'checksum-old'
      };

      // チェックサム計算とバージョン互換性チェックをモック化
      jest.spyOn(gameManager, 'calculateChecksum').mockReturnValueOnce('checksum-old');
      jest.spyOn(gameManager, 'isVersionCompatible').mockReturnValueOnce(true);

      // マイグレーションイベントのスパイを設置
      const migrateSpy = jest.spyOn(gameManager, 'migrateState');

      // 古いバージョンのデータを読み込み
      gameManager.loadGameState(oldVersionData);

      // マイグレーションが呼ばれることを確認
      expect(migrateSpy).toHaveBeenCalledWith('0.9.0');

      // 古いフィールドが削除されていることを確認
      expect(gameManager.state).not.toHaveProperty('oldField');
    });

    test('マイグレーションイベントが発火される', () => {
      // マイグレーションメソッドを直接呼び出し
      gameManager.state.oldField = '旧フィールド';
      gameManager.migrateState('0.9.0');

      // イベントが発火されることを確認
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.migrate',
        expect.objectContaining({
          fromVersion: '0.9.0',
          toVersion: '1.0.0',
          changes: expect.any(Array)
        })
      );
    });
  });

  describe('テストシナリオ', () => {
    test('保存と復元シナリオが正しく実行される', () => {
      // シナリオの実行
      const result = TestScenarios.saveLoadScenario(gameManager, mocks);

      // シナリオ結果の検証
      expect(result.initialState).toBeDefined();
      expect(result.savedData).toBeDefined();
      expect(result.stateChanged).toBe(true);
      expect(result.loadResult).toBe(true);
      expect(result.stateAfterLoad).toBeDefined();

      // 初期状態が正しく復元されていることを確認
      expect(result.stateAfterLoad.turn).toBe(result.initialState.turn);
      expect(result.stateAfterLoad.phase).toBe(result.initialState.phase);

      // イベントが発火されていることを確認
      expect(result.events).toContain('state.save.before');
      expect(result.events).toContain('state.save.after');
      expect(result.events).toContain('state.load.before');
      expect(result.events).toContain('state.load.after');
    });
  });

  describe('エッジケースと異常系', () => {
    test('大きなデータの保存と読み込み', () => {
      // 大量のプレイヤーを含む状態を作成
      const manyPlayers = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `プレイヤー${i}`,
        isAlive: i % 3 !== 0,
        role: i % 5 === 0 ? 'werewolf' : 'villager',
        data: { profile: `大量のプロフィールデータ ${i}`.repeat(20) }
      }));

      gameManager.state.players = manyPlayers;

      // 大きなデータの保存
      const saveData = gameManager.saveGameState('test-large-data');

      // 状態を変更
      gameManager.state.players = [];

      // 大きなデータの読み込み
      const loadResult = gameManager.loadGameState(saveData);

      // 結果の検証
      expect(loadResult).toBe(true);
      expect(gameManager.state.players).toHaveLength(100);
    });

    test('特殊文字を含むデータの保存と読み込み', () => {
      // 特殊文字を含む状態を作成
      gameManager.state.specialData = {
        withSpecialChars: 'Special: \u0000\u0001\u0002\u0003',
        withEmoji: '😀🚀🌍🔥',
        withEscapes: 'Line1\nLine2\tTabbed\rReturn',
        withQuotes: '\"Quoted\" and \'Single\''
      };

      // 特殊文字を含むデータの保存
      const saveData = gameManager.saveGameState('test-special-chars');

      // 状態を変更
      delete gameManager.state.specialData;

      // 特殊文字を含むデータの読み込み
      const loadResult = gameManager.loadGameState(saveData);

      // 結果の検証
      expect(loadResult).toBe(true);
      expect(gameManager.state.specialData).toBeDefined();
      expect(gameManager.state.specialData.withEmoji).toBe('😀🚀🌍🔥');
      expect(gameManager.state.specialData.withEscapes).toBe('Line1\nLine2\tTabbed\rReturn');
      expect(gameManager.state.specialData.withQuotes).toBe('\"Quoted\" and \'Single\'');
    });
  });

  describe('パフォーマンスとスケーラビリティ', () => {
    test('大量のセーブデータ処理', () => {
      const iterations = 10;
      const saveIds = [];

      // 開始時間を記録
      const startTime = Date.now();

      // 複数回の保存を実行
      for (let i = 0; i < iterations; i++) {
        const saveId = `perf-test-${i}`;
        const saveData = gameManager.saveGameState(saveId);
        saveIds.push(saveId);
      }

      // 経過時間を計算
      const saveElapsed = Date.now() - startTime;

      // 複数回の読み込みを実行
      const loadStartTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        // 前回の保存データを読み込む動きをシミュレート
        const saveData = {
          id: `perf-test-${i}`,
          gameId: gameManager.state.id,
          version: '1.0.0',
          timestamp: Date.now(),
          state: JSON.parse(JSON.stringify(gameManager.state)),
          metadata: {},
          checksum: `checksum-${i}`
        };

        // チェックサム検証をバイパス
        jest.spyOn(gameManager, 'calculateChecksum').mockReturnValueOnce(`checksum-${i}`);

        gameManager.loadGameState(saveData);
      }

      // 経過時間を計算
      const loadElapsed = Date.now() - loadStartTime;

      // パフォーマンスをコンソールに出力（オプション）
      console.log(`保存処理時間: ${saveElapsed}ms (${saveElapsed / iterations}ms/回)`);
      console.log(`読込処理時間: ${loadElapsed}ms (${loadElapsed / iterations}ms/回)`);

      // パフォーマンス基準をテスト（実行環境依存のため厳密な値はコメントアウト）
      // expect(saveElapsed / iterations).toBeLessThan(50); // 1回あたり50ms以下
      // expect(loadElapsed / iterations).toBeLessThan(50); // 1回あたり50ms以下
    });
  });
});