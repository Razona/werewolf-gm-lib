/**
 * GameManagerError Mixin テスト
 */

import GameManagerErrorMixin from '../GameManagerError';
import ErrorLevel from '../../../core/error/ErrorLevel';

// モックの依存モジュール
const mockEventSystem = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

const mockErrorHandler = {
  createError: jest.fn((code, message, context) => ({
    code,
    message,
    context,
    level: ErrorLevel.ERROR
  })),
  handleError: jest.fn(),
  policy: {
    throwOnLevel: ErrorLevel.FATAL,
    logLevel: ErrorLevel.WARNING,
    emitEvents: true
  }
};

const mockPlayerManager = {
  getPlayer: jest.fn(),
  getAllPlayers: jest.fn(() => []),
  getAlivePlayers: jest.fn(() => []),
  getPlayerCount: jest.fn(() => 0),
  getAlivePlayerCount: jest.fn(() => 0),
  isPlayerAlive: jest.fn()
};

const mockPhaseManager = {
  getCurrentPhase: jest.fn(() => ({ id: 'day', name: '昼フェーズ' }))
};

const mockRoleManager = {
  getPlayerTeam: jest.fn()
};

// GameManagerのモック
class MockGameManager {
  constructor() {
    this.eventSystem = mockEventSystem;
    this.errorHandler = mockErrorHandler;
    this.playerManager = mockPlayerManager;
    this.phaseManager = mockPhaseManager;
    this.roleManager = mockRoleManager;
    this.state = {
      isStarted: false,
      isEnded: false,
      turn: 0,
      startTime: Date.now() - 1000
    };
    this.options = {
      regulations: {},
      testMode: false
    };
    // トランザクション関連メソッド
    this.transactionInProgress = false;
    this.beginTransaction = jest.fn(() => { this.transactionInProgress = true; });
    this.commitTransaction = jest.fn(() => { this.transactionInProgress = false; });
    this.rollbackTransaction = jest.fn(() => { this.transactionInProgress = false; });
    // エラー履歴
    this.errorHistory = [];
  }
}

// コンソールログをモック化
const originalConsole = { ...console };
beforeAll(() => {
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn()
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// テスト前の準備
let gameManager;
beforeEach(() => {
  // モックのリセット
  jest.clearAllMocks();

  // テスト用のGameManagerインスタンス作成
  const GameManager = MockGameManager;
  // Mixinの適用
  GameManagerErrorMixin(GameManager);
  gameManager = new GameManager();
});

describe('GameManagerError', () => {
  describe('初期化とポリシー設定', () => {
    test('Mix-inが正しく適用される', () => {
      expect(gameManager.setErrorPolicy).toBeDefined();
      expect(gameManager.validateOperation).toBeDefined();
      expect(gameManager.handleGameError).toBeDefined();
      expect(gameManager.getDiagnostics).toBeDefined();
    });

    test('エラーポリシーを正しく設定できる', () => {
      const policy = {
        throwLevel: ErrorLevel.ERROR,
        logLevel: ErrorLevel.INFO,
        emitEvents: false
      };

      const result = gameManager.setErrorPolicy(policy);

      expect(result).toEqual({
        ...mockErrorHandler.policy,
        ...policy
      });
      expect(gameManager.errorHandler.policy).toEqual(result);
    });

    test('無効なエラーレベルを指定した場合は警告が出る', () => {
      const invalidPolicy = {
        throwLevel: 'invalidLevel',
        logLevel: 'anotherInvalidLevel'
      };

      gameManager.setErrorPolicy(invalidPolicy);

      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('無効なthrowLevel'));
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('無効なlogLevel'));
    });
  });

  describe('操作検証', () => {
    test('ゲーム開始状態の検証が正しく行われる', () => {
      // ゲーム未開始時に実行不可の操作
      let result = gameManager.validateOperation('vote');
      expect(result.valid).toBe(false);
      expect(result.code).toBe('GAME_NOT_STARTED');

      // ゲーム開始後のみ実行可能な操作をゲーム開始後に実行
      gameManager.state.isStarted = true;
      result = gameManager.validateOperation('vote');
      expect(result.valid).toBe(true);

      // ゲーム開始前のみ実行可能な操作をゲーム開始後に実行
      result = gameManager.validateOperation('addPlayer');
      expect(result.valid).toBe(false);
      expect(result.code).toBe('GAME_ALREADY_STARTED');

      // ゲーム終了後の操作
      gameManager.state.isEnded = true;
      result = gameManager.validateOperation('vote');
      expect(result.valid).toBe(false);
      expect(result.code).toBe('GAME_ALREADY_ENDED');
    });

    test('プレイヤー検証が正しく行われる', () => {
      gameManager.state.isStarted = true;

      // 存在しないプレイヤー
      mockPlayerManager.getPlayer.mockReturnValueOnce(null);
      const result = gameManager.validateOperation('vote', { playerId: 999 });
      expect(result.valid).toBe(false);
      expect(result.code).toBe('PLAYER_NOT_FOUND');

      // 死亡プレイヤーの行動制限
      mockPlayerManager.getPlayer.mockReturnValueOnce({ id: 1, name: 'テストプレイヤー' });
      mockPlayerManager.isPlayerAlive.mockReturnValueOnce(false);
      const result2 = gameManager.validateOperation('vote', { playerId: 1 });
      expect(result2.valid).toBe(false);
      expect(result2.code).toBe('PLAYER_NOT_ALIVE');
    });

    test('フェーズ検証が正しく行われる', () => {
      gameManager.state.isStarted = true;
      mockPhaseManager.getCurrentPhase.mockReturnValueOnce({ id: 'night', name: '夜フェーズ' });

      // 現在のフェーズと異なる操作
      const result = gameManager.validateOperation('vote', { phase: 'day' });
      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_PHASE');
    });

    test('投票操作の特殊検証が正しく行われる', () => {
      gameManager.state.isStarted = true;
      gameManager.state.phase = 'day';
      mockPlayerManager.getPlayer.mockImplementation(id => {
        if (id === 1) return { id: 1, name: 'プレイヤー1' };
        if (id === 2) return { id: 2, name: 'プレイヤー2' };
        return null;
      });
      mockPlayerManager.isPlayerAlive.mockReturnValue(true);

      // 有効な投票
      const validResult = gameManager.validateOperation('vote', {
        playerId: 1,
        targetId: 2,
        phase: 'day'
      });
      expect(validResult.valid).toBe(true);

      // 存在しない投票対象
      mockPlayerManager.getPlayer.mockImplementationOnce(id => {
        if (id === 1) return { id: 1, name: 'プレイヤー1' };
        return null;
      });
      const invalidTarget = gameManager.validateOperation('vote', {
        playerId: 1,
        targetId: 999,
        phase: 'day'
      });
      expect(invalidTarget.valid).toBe(false);
      expect(invalidTarget.code).toBe('INVALID_TARGET');

      // 死亡プレイヤーへの投票
      mockPlayerManager.getPlayer.mockImplementation(id => {
        if (id === 1) return { id: 1, name: 'プレイヤー1' };
        if (id === 2) return { id: 2, name: 'プレイヤー2' };
        return null;
      });
      mockPlayerManager.isPlayerAlive.mockImplementation(id => id !== 2);

      const deadTarget = gameManager.validateOperation('vote', {
        playerId: 1,
        targetId: 2,
        phase: 'day'
      });
      expect(deadTarget.valid).toBe(false);
      expect(deadTarget.code).toBe('TARGET_NOT_ALIVE');

      // 自己投票禁止設定
      gameManager.options.regulations.allowSelfVote = false;
      mockPlayerManager.isPlayerAlive.mockReturnValue(true);
      const selfVote = gameManager.validateOperation('vote', {
        playerId: 1,
        targetId: 1,
        phase: 'day'
      });
      expect(selfVote.valid).toBe(false);
      expect(selfVote.code).toBe('SELF_VOTE_FORBIDDEN');
    });

    test('アクション操作の特殊検証が正しく行われる', () => {
      gameManager.state.isStarted = true;
      gameManager.state.phase = 'night';
      mockPlayerManager.getPlayer.mockImplementation(id => {
        if (id === 1) return { id: 1, name: 'プレイヤー1' };
        if (id === 2) return { id: 2, name: 'プレイヤー2' };
        return null;
      });
      mockPlayerManager.isPlayerAlive.mockReturnValue(true);

      // 有効なアクション
      const validAction = gameManager.validateOperation('registerAction', {
        playerId: 1,
        targetId: 2,
        actionType: 'fortune',
      });
      expect(validAction.valid).toBe(true);

      // 存在しないアクション対象
      gameManager.state.phase = 'night'; // フェーズを再確認
      mockPlayerManager.getPlayer.mockImplementationOnce(id => {
        if (id === 1) return { id: 1, name: 'プレイヤー1' };
        return null;
      });

      const invalidTarget = gameManager.validateOperation('registerAction', {
        playerId: 1,
        targetId: 999,
        actionType: 'fortune',
        phase: 'night'
      });
      expect(invalidTarget.valid).toBe(false);
      expect(invalidTarget.code).toBe('INVALID_TARGET');

      // 連続ガード禁止
      gameManager.options.regulations.allowConsecutiveGuard = false;
      gameManager.getLastGuardedPlayerId = jest.fn().mockReturnValueOnce(2);

      const consecutiveGuard = gameManager.validateOperation('registerAction', {
        playerId: 1,
        targetId: 2,
        actionType: 'guard',
        phase: 'night'
      });
      expect(consecutiveGuard.valid).toBe(false);
      expect(consecutiveGuard.code).toBe('CONSECUTIVE_GUARD_FORBIDDEN');
    });
  });

  describe('エラーハンドリング', () => {
    test('基本的なエラーハンドリングが正しく行われる', () => {
      const error = new Error('テストエラー');

      gameManager.handleGameError(error);

      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    test('エラーオブジェクトの標準化が正しく行われる', () => {
      const error = new Error('テストエラー');
      const standardizedError = gameManager.standardizeError(error);

      expect(standardizedError.code).toBe('UNKNOWN_ERROR');
      expect(standardizedError.message).toBe('テストエラー');
      expect(standardizedError.level).toBe(ErrorLevel.ERROR);
      expect(standardizedError.context).toBeDefined();
      expect(standardizedError.context.originalError).toBe(error);
      expect(standardizedError.context.gameState).toBeDefined();
      expect(standardizedError.context.timestamp).toBeDefined();
    });

    test('トランザクション中のエラーでロールバックが実行される', () => {
      gameManager.transactionInProgress = true;
      const error = new Error('トランザクション中のエラー');

      gameManager.handleGameError(error);

      expect(gameManager.rollbackTransaction).toHaveBeenCalled();
    });

    test('エラー後の状態検証が呼ばれる（ゲーム開始状態の場合）', () => {
      gameManager.state.isStarted = true;
      gameManager.verifyStateAfterError = jest.fn();

      gameManager.handleGameError(new Error('テストエラー'));

      expect(gameManager.verifyStateAfterError).toHaveBeenCalled();
    });

    test('エラー後の状態検証は未開始状態では呼ばれない', () => {
      gameManager.state.isStarted = false;
      gameManager.verifyStateAfterError = jest.fn();

      gameManager.handleGameError(new Error('テストエラー'));

      expect(gameManager.verifyStateAfterError).not.toHaveBeenCalled();
    });
  });

  describe('状態検証とリカバリー', () => {
    beforeEach(() => {
      gameManager.state.isStarted = true;
    });

    test('プレイヤー状態の整合性確認が正しく行われる', () => {
      // 生存プレイヤーがいない状態
      mockPlayerManager.getAlivePlayers.mockReturnValueOnce([]);

      expect(() => gameManager.verifyStateAfterError()).toThrow('生存プレイヤーがいない');
    });

    test('人狼陣営全滅時に村人陣営勝利が適用される', () => {
      // 生存プレイヤーがいるが、人狼がいない状態
      mockPlayerManager.getAlivePlayers.mockReturnValueOnce([
        { id: 1, name: 'プレイヤー1' },
        { id: 2, name: 'プレイヤー2' }
      ]);
      mockRoleManager.getPlayerTeam.mockImplementation(id => 'village');

      gameManager.verifyStateAfterError();

      expect(gameManager.forceEndGame).toHaveBeenCalledWith({
        winner: 'village',
        reason: expect.stringContaining('人狼が全滅')
      });
    });

    test('人狼が村人以上になった時に人狼陣営勝利が適用される', () => {
      // 人狼と村人が同数の状態
      mockPlayerManager.getAlivePlayers.mockReturnValueOnce([
        { id: 1, name: 'プレイヤー1' },
        { id: 2, name: 'プレイヤー2' },
        { id: 3, name: 'プレイヤー3' },
        { id: 4, name: 'プレイヤー4' }
      ]);
      mockRoleManager.getPlayerTeam.mockImplementation(id => {
        if (id === 1 || id === 2) return 'village';
        return 'werewolf';
      });

      gameManager.verifyStateAfterError();

      expect(gameManager.forceEndGame).toHaveBeenCalledWith({
        winner: 'werewolf',
        reason: expect.stringContaining('人狼の数が村人以上')
      });
    });
  });

  describe('診断情報と出力', () => {
    test('診断情報の取得が正しく行われる', () => {
      const diagnostics = gameManager.getDiagnostics();

      expect(diagnostics.state).toBeDefined();
      expect(diagnostics.options).toBeDefined();
      expect(diagnostics.gameTime).toBeDefined();
      expect(diagnostics.phase).toBeDefined();
      expect(diagnostics.system).toBeDefined();
    });

    test('エラー詳細のログ出力が正しく行われる', () => {
      const error = new Error('詳細出力テスト');

      gameManager.logErrorDetails(error);

      expect(console.group).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('メッセージ'));
      expect(console.groupEnd).toHaveBeenCalled();
    });
  });

  describe('安全な操作実行', () => {
    test('通常操作の実行が正しく行われる', () => {
      const operation = jest.fn().mockReturnValue('操作結果');

      const result = gameManager.safeExecute(operation, 'testOperation');

      expect(operation).toHaveBeenCalled();
      expect(result).toBe('操作結果');
    });

    test('検証失敗時はエラーが発生する', () => {
      const operation = jest.fn();
      const validationResult = { valid: false, code: 'TEST_ERROR', message: '検証失敗' };
      gameManager.validateOperation = jest.fn().mockReturnValue(validationResult);
      mockErrorHandler.createError.mockReturnValueOnce(new Error('検証失敗'));

      const result = gameManager.safeExecute(operation, 'invalidOperation');

      expect(operation).not.toHaveBeenCalled();
      expect(mockErrorHandler.createError).toHaveBeenCalled();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('操作中のエラーが適切に処理される', () => {
      const operationError = new Error('操作中のエラー');
      const operation = jest.fn().mockImplementation(() => {
        throw operationError;
      });

      const result = gameManager.safeExecute(operation, 'errorOperation');

      expect(operation).toHaveBeenCalled();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('ゲーム強制終了', () => {
    test('ゲーム強制終了が正しく行われる', () => {
      gameManager.state.isStarted = true;
      const endInfo = { winner: 'village', reason: '強制終了テスト' };

      gameManager.forceEndGame(endInfo);

      expect(gameManager.beginTransaction).toHaveBeenCalled();
      expect(mockEventSystem.emit).toHaveBeenCalledWith('game.forceEnd.before', expect.any(Object));
      expect(gameManager.state.isEnded).toBe(true);
      expect(gameManager.state.winner).toBe('village');
      expect(gameManager.state.winReason).toBe('強制終了テスト');
      expect(mockEventSystem.emit).toHaveBeenCalledWith('game.forceEnd.after', expect.any(Object));
      expect(mockEventSystem.emit).toHaveBeenCalledWith('game.end', expect.any(Object));
      expect(gameManager.commitTransaction).toHaveBeenCalled();
    });

    test('ゲーム未開始状態での強制終了はエラーになる', () => {
      gameManager.state.isStarted = false;

      expect(() => gameManager.forceEndGame({ winner: 'village', reason: '終了' }))
        .toThrow('ゲームがまだ開始されていません');

      expect(mockErrorHandler.createError).toHaveBeenCalledWith('GAME_NOT_STARTED', expect.any(String), expect.any(Object));
      expect(gameManager.beginTransaction).not.toHaveBeenCalled();
    });

    test('終了処理中のエラーではロールバックが実行される', () => {
      gameManager.state.isStarted = true;
      mockEventSystem.emit.mockImplementationOnce(() => {
        throw new Error('終了処理中のエラー');
      });

      expect(() => gameManager.forceEndGame({ winner: 'village', reason: '終了' }))
        .toThrow('終了処理中のエラー');

      expect(gameManager.beginTransaction).toHaveBeenCalled();
      expect(gameManager.rollbackTransaction).toHaveBeenCalled();
      expect(gameManager.commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('ロギングシステム', () => {
    test('デフォルトロガーが取得できる', () => {
      const logger = gameManager.getLogger();

      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.fatal).toBeDefined();
    });

    test('カスタムロガーを設定できる', () => {
      const customLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        fatal: jest.fn()
      };

      gameManager.setLogger(customLogger);
      const logger = gameManager.getLogger();

      expect(logger).toBe(customLogger);
    });

    test('無効なロガーを設定するとエラーになる', () => {
      expect(() => gameManager.setLogger(null)).toThrow('有効なロガーオブジェクト');
      expect(() => gameManager.setLogger({})).toThrow('メソッドが必要');
    });
  });

  describe('エラー履歴', () => {
    test('エラー履歴を取得できる', () => {
      // エラー履歴にテストデータを追加
      gameManager.errorHistory = [
        { code: 'E001', message: 'エラー1', level: ErrorLevel.WARNING, timestamp: Date.now() - 1000 },
        { code: 'E002', message: 'エラー2', level: ErrorLevel.ERROR, timestamp: Date.now() - 500 },
        { code: 'E001', message: 'エラー3', level: ErrorLevel.ERROR, timestamp: Date.now() }
      ];

      const history = gameManager.getErrorHistory();

      expect(history.length).toBe(3);
      expect(history[0].code).toBe('E001'); // 最新順
    });

    test('エラー履歴をフィルタリングできる', () => {
      // エラー履歴にテストデータを追加
      gameManager.errorHistory = [
        { code: 'E001', message: 'エラー1', level: ErrorLevel.WARNING, timestamp: 1000 },
        { code: 'E002', message: 'エラー2', level: ErrorLevel.ERROR, timestamp: 2000 },
        { code: 'E001', message: 'エラー3', level: ErrorLevel.ERROR, timestamp: 3000 }
      ];

      // コード指定
      const filteredByCode = gameManager.getErrorHistory({ code: 'E001' });
      expect(filteredByCode.length).toBe(2);

      // レベル指定
      const filteredByLevel = gameManager.getErrorHistory({ level: ErrorLevel.ERROR });
      expect(filteredByLevel.length).toBe(2);

      // 時間指定
      const filteredBySince = gameManager.getErrorHistory({ since: 2000 });
      expect(filteredBySince.length).toBe(2);

      // 件数制限
      const limited = gameManager.getErrorHistory({}, 1);
      expect(limited.length).toBe(1);
    });
  });

  describe('テスト用機能', () => {
    test('テストモードでエラーをシミュレートできる', () => {
      gameManager.options.testMode = true;

      const simulatedError = gameManager.simulateError('E0101');

      expect(simulatedError.code).toBe('E0101');
      expect(simulatedError.context.simulated).toBe(true);
      expect(gameManager.errorHistory).toContain(simulatedError);
    });

    test('テストモードでないとシミュレートできない', () => {
      gameManager.options.testMode = false;

      expect(() => gameManager.simulateError('E0101')).toThrow('テストモードでのみ');
    });

    test('未知のエラーコードはシミュレートできない', () => {
      gameManager.options.testMode = true;

      expect(() => gameManager.simulateError('UNKNOWN_CODE')).toThrow('未知のエラーコード');
    });
  });

  describe('統合テスト', () => {
    beforeEach(() => {
      gameManager.state.isStarted = true;
      gameManager.state.turn = 2;
      mockPhaseManager.getCurrentPhase.mockReturnValue({ id: 'vote', name: '投票フェーズ' });
    });

    test('投票処理の完全なフロー', () => {
      // プレイヤー設定
      mockPlayerManager.getPlayer.mockImplementation(id => {
        const players = {
          1: { id: 1, name: 'プレイヤー1', isAlive: true },
          2: { id: 2, name: 'プレイヤー2', isAlive: true }
        };
        return players[id];
      });
      mockPlayerManager.isPlayerAlive.mockReturnValue(true);

      // 投票処理のモック
      const voteHandler = jest.fn().mockReturnValue({ success: true });
      gameManager.vote = voteHandler;

      // 安全な実行で投票処理
      const result = gameManager.safeExecute(
        () => gameManager.vote(1, 2),
        'vote',
        { playerId: 1, targetId: 2, phase: 'vote' }
      );

      expect(voteHandler).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual({ success: true });
    });

    test('エラー処理、検証、回復の統合フロー', () => {
      // プレイヤー設定
      mockPlayerManager.getAlivePlayers.mockReturnValue([
        { id: 1, name: 'プレイヤー1', isAlive: true },
        { id: 3, name: 'プレイヤー3', isAlive: true },
        { id: 4, name: 'プレイヤー4', isAlive: true }
      ]);
      mockRoleManager.getPlayerTeam.mockImplementation(id => {
        if (id === 1) return 'village';
        if (id === 3) return 'village';
        return 'werewolf';
      });

      // エラー発生
      const error = new Error('テスト統合エラー');
      gameManager.transactionInProgress = true;

      // エラー処理
      gameManager.handleGameError(error);

      // 検証
      expect(gameManager.rollbackTransaction).toHaveBeenCalled();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
      // 状態検証が実行されたが、上記プレイヤー設定では人狼と村人が1:2なので終了はされない
      expect(gameManager.forceEndGame).not.toHaveBeenCalled();
    });
  });
});
