/**
 * GameManagerState 状態検証機能テスト
 */

// モックと共通ユーティリティのインポート
import MockFactory from './shared/MockFactory';
import TestFixtures from './shared/TestFixtures';
import TestHelpers from './shared/TestHelpers';

// モック用のGameStateモジュール定義
const GameManagerStateMixin = (GameManager) => {
  // 現在のGameManagerクラスに状態管理機能を追加

  /**
   * 現在のゲーム状態を取得
   */
  GameManager.prototype.getCurrentState = function (options = {}) {
    return JSON.parse(JSON.stringify(this.state));
  };

  /**
   * 状態更新
   */
  GameManager.prototype.updateState = function (partialState, options = {}) {
    const { validate = true } = options;

    // バリデーションが有効な場合
    if (validate) {
      const validationResult = this.validateStateUpdate(partialState);
      if (!validationResult.valid) {
        throw this.errorHandler.createError(
          validationResult.code || 'STATE_VALIDATION_FAILED',
          validationResult.message || '状態の更新に失敗しました',
          { details: validationResult }
        );
      }
    }

    // 状態の更新
    this.state = {
      ...this.state,
      ...partialState,
      lastUpdate: Date.now()
    };

    return this.state;
  };

  /**
   * 状態更新のバリデーション
   */
  GameManager.prototype.validateStateUpdate = function (updates) {
    // 更新データが存在するか
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return {
        valid: false,
        code: 'STATE_INVALID_UPDATE',
        message: '更新データは空でないオブジェクトである必要があります'
      };
    }

    // 更新内容のJSONシリアライズが可能か確認
    try {
      JSON.stringify(updates);
    } catch (error) {
      return {
        valid: false,
        code: 'STATE_SERIALIZATION_ERROR',
        message: '更新データはシリアライズ可能である必要があります',
        details: error.message
      };
    }

    // ゲーム終了時は勝者情報が必要
    if (updates.isEnded === true && !updates.winner && !this.state.winner) {
      return {
        valid: false,
        code: 'STATE_INTEGRITY_VIOLATION',
        message: 'ゲーム終了時には勝者を指定する必要があります'
      };
    }

    // プレイヤー配列の検証
    if (updates.players !== undefined) {
      // playersが配列かチェック
      if (!Array.isArray(updates.players)) {
        return {
          valid: false,
          code: 'STATE_PLAYER_ARRAY_INVALID',
          message: 'players は配列である必要があります'
        };
      }

      // プレイヤー配列の内容を検証
      for (const player of updates.players) {
        if (!player || typeof player !== 'object' || !('id' in player)) {
          return {
            valid: false,
            code: 'STATE_PLAYER_INVALID',
            message: 'プレイヤーオブジェクトは id を持つオブジェクトである必要があります'
          };
        }
      }
    }

    // 役職配布情報の検証
    if (updates.roles && updates.roles.distributed === true) {
      // 配布情報があるかチェック
      if (!updates.roles.distribution || typeof updates.roles.distribution !== 'object' ||
        Object.keys(updates.roles.distribution).length === 0) {
        return {
          valid: false,
          code: 'STATE_ROLE_DISTRIBUTION_INVALID',
          message: 'roles.distributed が true の場合、distribution オブジェクトが必要です'
        };
      }
    }

    // ターンとフェーズの検証
    if (updates.turn !== undefined && typeof updates.turn !== 'number') {
      return {
        valid: false,
        code: 'STATE_TURN_INVALID',
        message: 'turn は数値である必要があります'
      };
    }

    if (updates.phase !== undefined && (updates.phase !== null && typeof updates.phase !== 'string')) {
      return {
        valid: false,
        code: 'STATE_PHASE_INVALID',
        message: 'phase は文字列または null である必要があります'
      };
    }

    // 状態フラグの検証
    if (updates.isStarted !== undefined && typeof updates.isStarted !== 'boolean') {
      return {
        valid: false,
        code: 'STATE_FLAG_INVALID',
        message: 'isStarted は真偽値である必要があります'
      };
    }

    if (updates.isEnded !== undefined && typeof updates.isEnded !== 'boolean') {
      return {
        valid: false,
        code: 'STATE_FLAG_INVALID',
        message: 'isEnded は真偽値である必要があります'
      };
    }

    return { valid: true };
  };

  /**
   * 保存データのバリデーション
   */
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

  /**
   * チェックサムの計算（簡易実装）
   */
  GameManager.prototype.calculateChecksum = function (data) {
    // 実際の実装では適切なハッシュアルゴリズムを使用
    try {
      const jsonStr = JSON.stringify(data);
      return `checksum-${jsonStr.length}`;
    } catch (error) {
      return 'invalid-checksum';
    }
  };

  /**
   * バージョン互換性チェック
   */
  GameManager.prototype.isVersionCompatible = function (version) {
    // 簡易実装：メジャーバージョンが一致すれば互換性あり
    const currentMajor = 1; // 現在の実装バージョン
    const saveMajor = parseInt(version.split('.')[0], 10);
    return !isNaN(saveMajor) && saveMajor === currentMajor;
  };

  /**
   * GameState の整合性チェック
   */
  GameManager.prototype.checkStateIntegrity = function () {
    const issues = [];

    // 基本的な整合性チェック
    if (this.state.isEnded && !this.state.isStarted) {
      issues.push('終了状態なのに開始状態になっていない');
    }

    if (this.state.isEnded && !this.state.winner) {
      issues.push('終了状態なのに勝者情報がない');
    }

    if (this.state.turn > 0 && !this.state.isStarted) {
      issues.push('ターンが進んでいるのに開始状態になっていない');
    }

    if (this.state.phase && !this.state.isStarted) {
      issues.push('フェーズが設定されているのに開始状態になっていない');
    }

    // プレイヤーと役職の整合性
    if (this.state.roles && this.state.roles.distributed) {
      // 役職配布済みなのに配布情報がない
      if (!this.state.roles.distribution || Object.keys(this.state.roles.distribution).length === 0) {
        issues.push('役職配布済みなのに配布情報がない');
      }

      // 役職配布情報とプレイヤーの整合性
      const distributionIds = Object.keys(this.state.roles.distribution).map(id => parseInt(id, 10));
      const playerIds = this.state.players.map(p => p.id);

      // 配布情報に存在しないプレイヤーIDがないか
      for (const id of distributionIds) {
        if (!playerIds.includes(id)) {
          issues.push(`役職配布情報に存在するプレイヤーID ${id} がプレイヤーリストに見つからない`);
        }
      }
    }

    // プレイヤーの死亡情報の整合性
    for (const player of this.state.players) {
      if (!player.isAlive) {
        // 死亡プレイヤーの原因が設定されているか
        if (!player.causeOfDeath) {
          issues.push(`プレイヤー ${player.id} は死亡しているが原因が設定されていない`);
        }

        // 死亡ターンが設定されているか
        if (player.deathTurn === undefined || player.deathTurn === null) {
          issues.push(`プレイヤー ${player.id} は死亡しているが死亡ターンが設定されていない`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
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
      this.state = JSON.parse(JSON.stringify(TestFixtures.initialState));
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

describe('GameManagerState 状態検証機能', () => {

  describe('状態更新の検証', () => {
    test('空の更新データが検出される', () => {
      expect(() => {
        gameManager.updateState({});
      }).toThrow();

      expect(() => {
        gameManager.updateState(null);
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_INVALID_UPDATE',
        expect.any(String),
        expect.any(Object)
      );
    });

    test('シリアライズ不可能な更新データが検出される', () => {
      // 循環参照を持つオブジェクト
      const circular = {};
      circular.self = circular;

      // 関数を含むオブジェクト
      const withFunction = {
        fn: () => { }
      };

      // 循環参照の更新
      expect(() => {
        gameManager.updateState({ badObject: circular });
      }).toThrow();

      // 関数を含む更新
      expect(() => {
        gameManager.updateState({ badObject: withFunction });
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_SERIALIZATION_ERROR',
        expect.any(String),
        expect.any(Object)
      );
    });

    test('終了時の勝者情報欠如が検出される', () => {
      // 勝者情報なしでゲーム終了
      expect(() => {
        gameManager.updateState({ isEnded: true });
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_INTEGRITY_VIOLATION',
        expect.any(String),
        expect.any(Object)
      );

      // 勝者情報ありの場合は成功
      expect(() => {
        gameManager.updateState({ isEnded: true, winner: 'village' });
      }).not.toThrow();
    });

    test('プレイヤー配列の形式が検証される', () => {
      // 配列でないプレイヤーデータ
      expect(() => {
        gameManager.updateState({ players: 'not an array' });
      }).toThrow();

      expect(() => {
        gameManager.updateState({ players: {} });
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_PLAYER_ARRAY_INVALID',
        expect.any(String),
        expect.any(Object)
      );

      // 無効なプレイヤーオブジェクトを含む配列
      expect(() => {
        gameManager.updateState({
          players: [
            { id: 0, name: 'valid' },
            'invalid', // 文字列は無効
            { name: 'missing id' } // ID欠落
          ]
        });
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_PLAYER_INVALID',
        expect.any(String),
        expect.any(Object)
      );

      // 有効なプレイヤー配列
      expect(() => {
        gameManager.updateState({
          players: [
            { id: 0, name: 'プレイヤー0' },
            { id: 1, name: 'プレイヤー1' }
          ]
        });
      }).not.toThrow();
    });

    test('役職配布情報の整合性が検証される', () => {
      // 配布フラグはtrueだが配布情報がない
      expect(() => {
        gameManager.updateState({
          roles: {
            list: ['villager', 'werewolf'],
            distributed: true,
            distribution: {} // 空のオブジェクト
          }
        });
      }).toThrow();

      // 配布フラグはtrueだが配布情報が配列
      expect(() => {
        gameManager.updateState({
          roles: {
            list: ['villager', 'werewolf'],
            distributed: true,
            distribution: [] // 配列（オブジェクトでない）
          }
        });
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_ROLE_DISTRIBUTION_INVALID',
        expect.any(String),
        expect.any(Object)
      );

      // 有効な役職配布情報
      expect(() => {
        gameManager.updateState({
          roles: {
            list: ['villager', 'werewolf'],
            distributed: true,
            distribution: { 0: 'villager', 1: 'werewolf' }
          }
        });
      }).not.toThrow();
    });

    test('ターンとフェーズの型が検証される', () => {
      // 無効なターン型
      expect(() => {
        gameManager.updateState({ turn: 'not a number' });
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_TURN_INVALID',
        expect.any(String),
        expect.any(Object)
      );

      // 無効なフェーズ型
      expect(() => {
        gameManager.updateState({ phase: 123 }); // 数値は無効
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_PHASE_INVALID',
        expect.any(String),
        expect.any(Object)
      );

      // 有効な値
      expect(() => {
        gameManager.updateState({ turn: 1, phase: 'day' });
      }).not.toThrow();

      // nullフェーズは有効
      expect(() => {
        gameManager.updateState({ phase: null });
      }).not.toThrow();
    });

    test('状態フラグの型が検証される', () => {
      // 無効な開始フラグ
      expect(() => {
        gameManager.updateState({ isStarted: 'true' }); // 文字列は無効
      }).toThrow();

      // 無効な終了フラグ
      expect(() => {
        gameManager.updateState({ isEnded: 1 }); // 数値は無効
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'STATE_FLAG_INVALID',
        expect.any(String),
        expect.any(Object)
      );

      // 有効なフラグ
      expect(() => {
        gameManager.updateState({ isStarted: true, isEnded: false });
      }).not.toThrow();
    });

    test('validateオプションでバリデーションをスキップできる', () => {
      // 通常は検証エラーになる無効なデータ
      const invalidUpdate = { players: 'not an array' };

      // バリデーションをスキップして更新
      expect(() => {
        gameManager.updateState(invalidUpdate, { validate: false });
      }).not.toThrow();

      // 更新が適用されていることを確認
      expect(gameManager.state.players).toBe('not an array');
    });
  });

  describe('保存データの検証', () => {
    test('nullデータが検出される', () => {
      // nullデータのバリデーション
      const result = gameManager.validateSaveData(null);

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.code).toBe('STATE_SAVE_INVALID');
      expect(result.message).toContain('存在しません');
    });

    test('必須フィールド欠損が検出される', () => {
      // 必須フィールドが欠けたデータ
      const incompleteData = {
        id: 'test-save',
        // gameId が欠けている
        version: '1.0.0',
        timestamp: Date.now(),
        state: {},
        checksum: 'test-checksum'
      };

      // バリデーション
      const result = gameManager.validateSaveData(incompleteData);

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.code).toBe('STATE_SAVE_INVALID');
      expect(result.message).toContain('gameId');
    });

    test('無効な状態データが検出される', () => {
      // 無効な状態データ
      const invalidData = {
        id: 'test-save',
        gameId: 'test-game',
        version: '1.0.0',
        timestamp: Date.now(),
        state: null, // nullは無効
        checksum: 'test-checksum'
      };

      // バリデーション
      const result = gameManager.validateSaveData(invalidData);

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.code).toBe('STATE_SAVE_INVALID');
      expect(result.message).toContain('無効な状態データ');
    });

    test('チェックサム不一致が検出される', () => {
      // チェックサムが不一致のデータ
      const mismatchData = {
        id: 'test-save',
        gameId: 'test-game',
        version: '1.0.0',
        timestamp: Date.now(),
        state: { test: 'data' },
        checksum: 'wrong-checksum'
      };

      // バリデーション
      const result = gameManager.validateSaveData(mismatchData);

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.code).toBe('STATE_CHECKSUM_FAILED');
      expect(result.message).toContain('チェックサム');
      expect(result.details).toHaveProperty('expected', 'wrong-checksum');
      expect(result.details).toHaveProperty('actual');
    });

    test('バージョン互換性が検証される', () => {
      // 互換性のないバージョンのデータ
      const incompatibleData = {
        id: 'test-save',
        gameId: 'test-game',
        version: '2.0.0', // メジャーバージョンが異なる
        timestamp: Date.now(),
        state: { test: 'data' },
        checksum: 'dummy'
      };

      // チェックサム計算をモック
      jest.spyOn(gameManager, 'calculateChecksum').mockReturnValueOnce('dummy');

      // バリデーション
      const result = gameManager.validateSaveData(incompatibleData);

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.code).toBe('STATE_VERSION_INCOMPATIBLE');
      expect(result.message).toContain('互換性のないバージョン');
      expect(result.details).toHaveProperty('saveVersion', '2.0.0');
      expect(result.details).toHaveProperty('currentVersion', '1.0.0');
    });

    test('有効なデータは成功する', () => {
      // 有効なデータ
      const validData = {
        id: 'test-save',
        gameId: 'test-game',
        version: '1.0.0',
        timestamp: Date.now(),
        state: { test: 'data' },
        checksum: 'dummy'
      };

      // チェックサム計算をモック
      jest.spyOn(gameManager, 'calculateChecksum').mockReturnValueOnce('dummy');

      // バリデーション
      const result = gameManager.validateSaveData(validData);

      // 検証結果のチェック
      expect(result.valid).toBe(true);
    });
  });

  describe('状態整合性チェック', () => {
    test('フラグの整合性検証', () => {
      // 整合性が取れていない状態を設定
      gameManager.state = {
        ...gameManager.state,
        isStarted: false,
        isEnded: true, // 開始していないのに終了している（矛盾）
        turn: 5, // 開始していないのにターンが進んでいる（矛盾）
        phase: 'night' // 開始していないのにフェーズがある（矛盾）
      };

      // 整合性チェック
      const result = gameManager.checkStateIntegrity();

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('終了状態なのに開始状態になっていない');
      expect(result.issues).toContain('ターンが進んでいるのに開始状態になっていない');
      expect(result.issues).toContain('フェーズが設定されているのに開始状態になっていない');
    });

    test('勝者情報の整合性検証', () => {
      // 勝者情報がない終了状態
      gameManager.state = {
        ...gameManager.state,
        isStarted: true,
        isEnded: true,
        winner: null // 勝者情報がない（矛盾）
      };

      // 整合性チェック
      const result = gameManager.checkStateIntegrity();

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('終了状態なのに勝者情報がない');
    });

    test('役職配布の整合性検証', () => {
      // 配布済みなのに配布情報がない状態
      gameManager.state = {
        ...gameManager.state,
        roles: {
          list: ['villager', 'werewolf'],
          distributed: true, // 配布済みフラグ
          distribution: {} // 空の配布情報（矛盾）
        }
      };

      // 整合性チェック
      const result = gameManager.checkStateIntegrity();

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('役職配布済みなのに配布情報がない');
    });

    test('プレイヤーと役職割り当ての整合性検証', () => {
      // 存在しないプレイヤーIDへの役職割り当て
      gameManager.state = {
        ...gameManager.state,
        players: [
          { id: 0, name: 'プレイヤー0' },
          { id: 1, name: 'プレイヤー1' }
        ],
        roles: {
          list: ['villager', 'werewolf', 'seer'],
          distributed: true,
          distribution: {
            0: 'villager',
            1: 'werewolf',
            2: 'seer' // 存在しないプレイヤーID（矛盾）
          }
        }
      };

      // 整合性チェック
      const result = gameManager.checkStateIntegrity();

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('役職配布情報に存在するプレイヤーID 2 がプレイヤーリストに見つからない');
    });

    test('死亡プレイヤーの情報整合性検証', () => {
      // 死亡情報が不完全なプレイヤー
      gameManager.state = {
        ...gameManager.state,
        players: [
          { id: 0, name: 'プレイヤー0', isAlive: true },
          { id: 1, name: 'プレイヤー1', isAlive: false }, // 死因が未設定
          { id: 2, name: 'プレイヤー2', isAlive: false, causeOfDeath: 'execution' } // 死亡ターンが未設定
        ]
      };

      // 整合性チェック
      const result = gameManager.checkStateIntegrity();

      // 検証結果のチェック
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('プレイヤー 1 は死亡しているが原因が設定されていない');
      expect(result.issues).toContain('プレイヤー 1 は死亡しているが死亡ターンが設定されていない');
      expect(result.issues).toContain('プレイヤー 2 は死亡しているが死亡ターンが設定されていない');
    });

    test('整合性のある状態は正常に検証される', () => {
      // 整合性のある状態
      gameManager.state = {
        ...gameManager.state,
        isStarted: true,
        isEnded: true,
        winner: 'village',
        turn: 5,
        phase: 'end',
        players: [
          { id: 0, name: 'プレイヤー0', isAlive: true },
          { id: 1, name: 'プレイヤー1', isAlive: false, causeOfDeath: 'execution', deathTurn: 3 }
        ],
        roles: {
          list: ['villager', 'werewolf'],
          distributed: true,
          distribution: { 0: 'villager', 1: 'werewolf' }
        }
      };

      // 整合性チェック
      const result = gameManager.checkStateIntegrity();

      // 検証結果のチェック
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });
  });

  describe('ヘルパー関数', () => {
    test('isVersionCompatible の動作', () => {
      // 互換性のあるバージョン
      expect(gameManager.isVersionCompatible('1.0.0')).toBe(true);
      expect(gameManager.isVersionCompatible('1.1.0')).toBe(true);
      expect(gameManager.isVersionCompatible('1.9.9')).toBe(true);

      // 互換性のないバージョン
      expect(gameManager.isVersionCompatible('0.9.0')).toBe(false);
      expect(gameManager.isVersionCompatible('2.0.0')).toBe(false);

      // 無効なバージョン文字列
      expect(gameManager.isVersionCompatible('invalid')).toBe(false);
      expect(gameManager.isVersionCompatible('')).toBe(false);
    });

    test('calculateChecksum の動作', () => {
      // 基本的なオブジェクト
      const checksum1 = gameManager.calculateChecksum({ test: 'data' });
      expect(checksum1).toMatch(/^checksum-\d+$/);

      // 同じデータでは同じチェックサム
      const checksum2 = gameManager.calculateChecksum({ test: 'data' });
      expect(checksum1).toBe(checksum2);

      // 異なるデータでは異なるチェックサム
      const checksum3 = gameManager.calculateChecksum({ test: 'different' });
      expect(checksum1).not.toBe(checksum3);

      // シリアライズ不可能なデータ
      const circular = {};
      circular.self = circular;

      const checksumInvalid = gameManager.calculateChecksum(circular);
      expect(checksumInvalid).toBe('invalid-checksum');
    });
  });

  describe('エッジケースと異常系', () => {
    test('空のプレイヤー配列は有効', () => {
      // 空の配列は有効
      expect(() => {
        gameManager.updateState({ players: [] });
      }).not.toThrow();
    });

    test('同時に複数の検証エラーを含む更新', () => {
      // 複数の検証エラーを含む更新
      const multipleErrors = {
        turn: 'invalid',
        isStarted: 'invalid',
        players: 'invalid'
      };

      // 最初に検出されたエラーで失敗する
      expect(() => {
        gameManager.updateState(multipleErrors);
      }).toThrow();

      // エラー処理の回数チェック - 1回のみのはず
      expect(mocks.errorHandler.createError).toHaveBeenCalledTimes(1);
    });

    test('非常に長い文字列を含む状態の検証', () => {
      // 非常に長い文字列
      const longString = 'a'.repeat(10000);

      // 長い文字列を含む更新
      expect(() => {
        gameManager.updateState({ longField: longString });
      }).not.toThrow();

      // チェックサム計算
      const checksum = gameManager.calculateChecksum({ longField: longString });
      expect(checksum).toMatch(/^checksum-\d+$/);

      // チェックサムが長さに基づいていることを確認
      expect(checksum).toContain((JSON.stringify({ longField: longString }).length).toString());
    });
  });
});