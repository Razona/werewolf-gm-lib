import PhaseManager from '../PhaseManager';
import Phase from '../Phase';

// モックの作成
const createMockPhase = (id, options = {}) => ({
  id,
  displayName: `Mock ${id} Phase`,
  description: `Mock phase for ${id}`,
  allowedActions: [],
  onPhaseStart: jest.fn(),
  onPhaseEnd: jest.fn(),
  isActionAllowed: jest.fn().mockReturnValue(true),
  getRemainingTime: jest.fn().mockReturnValue(60),
  updateVisibilityPolicy: jest.fn(),
  ...options
});

// モックのEventSystem
const mockEventSystem = {
  emit: jest.fn(),
  on: jest.fn().mockImplementation((event, callback) => {
    return { remove: jest.fn() }; // リスナー削除用のオブジェクト
  }),
  off: jest.fn(),
  once: jest.fn()
};

// モックのErrorHandler
const mockErrorHandler = {
  handleError: jest.fn(),
  createError: jest.fn().mockImplementation((code, message, context) => {
    return new Error(`${code}: ${message} `);
  })
};

// モックのGameState
const mockGameState = {
  updateState: jest.fn(),
  getState: jest.fn().mockReturnValue({
    turn: 1,
    phase: 'preparation',
    players: []
  })
};

// モックのGame
const mockGame = {
  eventSystem: mockEventSystem,
  errorHandler: mockErrorHandler,
  gameState: mockGameState,
  getCurrentTurn: jest.fn().mockReturnValue(1),
  checkVictoryCondition: jest.fn().mockReturnValue(null), // 勝利条件未達成
  getAlivePlayers: jest.fn().mockReturnValue([]),
  options: {
    regulations: {
      firstDayExecution: false // 初日処刑なし
    }
  }
};

// 基本フェーズセット
const mockPhases = {
  preparation: createMockPhase('preparation'),
  firstNight: createMockPhase('firstNight'),
  firstDay: createMockPhase('firstDay'),
  vote: createMockPhase('vote'),
  runoffVote: createMockPhase('runoffVote'),
  execution: createMockPhase('execution'),
  night: createMockPhase('night'),
  day: createMockPhase('day'),
  gameEnd: createMockPhase('gameEnd')
};

describe('PhaseManager', () => {
  let phaseManager;
  let originalDateNow;
  const mockTime = 1000000000000; // 基準時刻

  beforeEach(() => {
    jest.clearAllMocks();

    // Date.now()のモック化
    originalDateNow = Date.now;
    Date.now = jest.fn().mockImplementation(() => mockTime);

    // PhaseManager実装の前提として、内部でmockPhasesをマップとして使用すると仮定
    jest.spyOn(Phase, 'createStandardPhases').mockReturnValue(mockPhases);

    phaseManager = new PhaseManager(mockGame);
  });

  afterEach(() => {
    // Date.nowのモックを解除
    Date.now = originalDateNow;
  });

  // 時間経過をシミュレートする関数
  function advanceTime(milliseconds) {
    const newTime = Date.now() + milliseconds;
    Date.now = jest.fn().mockImplementation(() => newTime);
    return newTime;
  }

  describe('初期化', () => {
    it('コンストラクターが正しく初期化されること', () => {
      expect(phaseManager.getCurrentPhase().id).toBe('preparation');
      expect(phaseManager.getCurrentTurn()).toBe(1);
    });

    it('オプション付きで初期化できること', () => {
      const options = {
        initialPhase: 'firstNight',
        initialTurn: 2,
        maxHistorySize: 20
      };

      const customPhaseManager = new PhaseManager(mockGame, options);

      expect(customPhaseManager.getCurrentPhase().id).toBe('firstNight');
      expect(customPhaseManager.getCurrentTurn()).toBe(2);
    });

    it('無効なオプションを使用した場合にデフォルト値が適用されること', () => {
      const invalidOptions = {
        initialPhase: 'nonExistentPhase',
        initialTurn: -1
      };

      const defaultPhaseManager = new PhaseManager(mockGame, invalidOptions);

      // デフォルト値への回帰を確認
      expect(defaultPhaseManager.getCurrentPhase().id).toBe('preparation');
      expect(defaultPhaseManager.getCurrentTurn()).toBe(1);
    });
  });

  describe('フェーズ遷移', () => {
    beforeEach(() => {
      // フェーズ遷移のテスト前に標準遷移ルールを初期化
      phaseManager.initializeTransitions();
    });

    it('準備フェーズから初日夜フェーズへの遷移が正しく行われること', () => {
      // 初期フェーズが準備フェーズであることを確認
      expect(phaseManager.getCurrentPhase().id).toBe('preparation');

      // 次のフェーズへ遷移
      phaseManager.moveToNextPhase();

      // 初日夜フェーズに遷移したことを検証
      expect(phaseManager.getCurrentPhase().id).toBe('firstNight');

      // イベント発火の検証
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'phase.end.preparation',
        expect.objectContaining({
          phase: 'preparation',
          turn: 1
        })
      );

      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'phase.start.firstNight',
        expect.objectContaining({
          phase: 'firstNight',
          turn: expect.any(Number)
        })
      );

      // フェーズライフサイクルメソッドの呼び出し検証
      expect(mockPhases.preparation.onPhaseEnd).toHaveBeenCalled();
      expect(mockPhases.firstNight.onPhaseStart).toHaveBeenCalled();
    });

    it('投票フェーズから同票による決選投票フェーズへの遷移が正しく行われること', () => {
      // ゲーム進行を投票フェーズまで進める
      phaseManager.moveToPhase('vote');

      // 同票状態をシミュレート
      const contextData = {
        isTie: true,
        maxVoted: [1, 2], // 同票のプレイヤーID
        needsRunoff: true
      };
      phaseManager.setPhaseContext(contextData);
      
      // コンテキストが正しく設定されているか確認
      const context = phaseManager.getPhaseContext();
      expect(context.data.needsRunoff).toBe(true);

      // 次のフェーズへ遷移
      phaseManager.moveToNextPhase();

      // 決選投票フェーズに遷移したことを検証
      expect(phaseManager.getCurrentPhase().id).toBe('runoffVote');

      // コンテキストデータが適切に引き継がれていることを確認
      const updatedContext = phaseManager.getPhaseContext();
      expect(updatedContext.data).toMatchObject({
        runoffCandidates: [1, 2]
      });
    });

    it('勝利条件達成時にゲーム終了フェーズに遷移すること', () => {
      // 夜フェーズをセットアップ
      phaseManager.moveToPhase('night');

      // 勝利条件達成をシミュレート
      mockGame.checkVictoryCondition.mockReturnValueOnce({
        winner: 'village',
        reason: 'すべての人狼が排除された'
      });

      // 次のフェーズへ遷移
      phaseManager.moveToNextPhase();

      // ゲーム終了フェーズに遷移したことを検証
      expect(phaseManager.getCurrentPhase().id).toBe('gameEnd');

      // 勝利条件チェックが呼ばれたことを確認
      expect(mockGame.checkVictoryCondition).toHaveBeenCalled();
    });

    it('不正なフェーズIDを指定した場合にエラーをスローすること', () => {
      // 不正なフェーズへの遷移を試みる
      const invalidTransition = () => {
        phaseManager.moveToPhase('non-existent-phase');
      };

      // エラーがスローされることを確認
      expect(invalidTransition).toThrow();

      // エラーハンドラが呼ばれたことを確認
      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        expect.stringContaining('INVALID_PHASE'),
        expect.any(String),
        expect.objectContaining({
          phaseId: 'non-existent-phase'
        })
      );
    });
  });

  describe('ターン管理', () => {
    it('夜フェーズから昼フェーズへの遷移でターン数が増加すること', () => {
      // 初期ターン数を確認
      const initialTurn = phaseManager.getCurrentTurn();

      // 夜フェーズへ移動
      phaseManager.moveToPhase('night');

      // 昼フェーズへ移動
      phaseManager.moveToNextPhase();

      // ターン数が増加したことを確認
      expect(phaseManager.getCurrentTurn()).toBe(initialTurn + 1);

      // ターン開始イベントが発火されたことを確認
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'turn.start',
        expect.objectContaining({
          turn: initialTurn + 1
        })
      );
    });

    it('その他のフェーズ遷移ではターン数が増加しないこと', () => {
      // 初期ターン数を確認
      const initialTurn = phaseManager.getCurrentTurn();

      // 準備フェーズから初日夜フェーズへ移動
      phaseManager.moveToNextPhase();

      // ターン数が変わらないことを確認
      expect(phaseManager.getCurrentTurn()).toBe(initialTurn);

      // 初日夜から初日昼へ移動
      phaseManager.moveToNextPhase();

      // ターン数が変わらないことを確認
      expect(phaseManager.getCurrentTurn()).toBe(initialTurn);
    });

    it('明示的にターン数を増加させることができること', () => {
      // 初期ターン数を確認
      const initialTurn = phaseManager.getCurrentTurn();

      // 明示的にターン数を増加
      phaseManager.incrementTurn();

      // ターン数が増加したことを確認
      expect(phaseManager.getCurrentTurn()).toBe(initialTurn + 1);

      // ターン開始イベントが発火されたことを確認
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'turn.start',
        expect.objectContaining({
          turn: initialTurn + 1,
          previousTurn: initialTurn
        })
      );

      // ゲーム状態が更新されたことを確認
      expect(mockGameState.updateState).toHaveBeenCalledWith(
        expect.objectContaining({
          turn: initialTurn + 1
        })
      );
    });
  });

  describe('フェーズ履歴', () => {
    it('フェーズ遷移履歴が正確に記録されること', () => {
      // 複数のフェーズ遷移を実行
      phaseManager.moveToNextPhase(); // preparation → firstNight
      phaseManager.moveToNextPhase(); // firstNight → firstDay
      phaseManager.moveToNextPhase(); // firstDay → vote

      // 履歴を取得
      const history = phaseManager.getPhaseHistory();

      // 履歴の長さを確認
      expect(history.length).toBe(3);

      // 履歴の内容を確認
      expect(history[0].phaseId).toBe('preparation');
      expect(history[0].status).toBe('completed');

      expect(history[1].phaseId).toBe('firstNight');
      expect(history[1].status).toBe('completed');

      expect(history[2].phaseId).toBe('firstDay');
      expect(history[2].status).toBe('completed');
    });

    it('前回のフェーズコンテキストを取得できること', () => {
      // フェーズコンテキストデータを設定
      phaseManager.setPhaseContext({
        testData: 'test value'
      });

      // 次のフェーズへ遷移
      phaseManager.moveToNextPhase();

      // 前回のフェーズコンテキストを取得
      const prevContext = phaseManager.getPreviousPhaseContext();

      // コンテキストデータを確認
      expect(prevContext).toBeDefined();
      expect(prevContext.data).toMatchObject({
        testData: 'test value'
      });
    });
  });

  describe('カスタムフェーズ登録', () => {
    it('新規フェーズを動的に登録できること', () => {
      // カスタムフェーズの定義
      const customPhase = createMockPhase('custom-special-phase', {
        displayName: 'カスタム特殊フェーズ',
        description: 'テスト用の特殊フェーズ',
        allowedActions: ['special-action']
      });

      // フェーズを登録
      phaseManager.registerPhase(customPhase);

      // 登録したフェーズを取得できることを確認
      const registeredPhase = phaseManager.getPhaseById('custom-special-phase');
      expect(registeredPhase).toBe(customPhase);
      expect(registeredPhase.displayName).toBe('カスタム特殊フェーズ');
    });

    it('カスタム遷移ルールを登録できること', () => {
      // カスタムフェーズを登録
      const customPhase = createMockPhase('custom-phase');
      phaseManager.registerPhase(customPhase);

      // カスタム遷移ルールを登録
      const customTransition = {
        sourcePhase: 'day',
        targetPhase: 'custom-phase',
        condition: () => true,
        priority: 20
      };

      phaseManager.registerTransition(customTransition);

      // 遷移ルールが登録されていることを確認（実装依存）
      // この部分は、実際のPhaseManagerの実装に合わせて調整する必要がある

      // 登録した遷移ルールによって移行できることを確認
      phaseManager.moveToPhase('day');
      phaseManager.moveToNextPhase();

      // カスタムフェーズに遷移したことを検証
      expect(phaseManager.getCurrentPhase().id).toBe('custom-phase');
    });
  });

  describe('フェーズコンテキスト管理', () => {
    it('フェーズコンテキストを設定・取得できること', () => {
      const contextData = {
        testField: 'testValue',
        numericField: 42
      };

      // コンテキスト設定
      phaseManager.setPhaseContext(contextData);

      // コンテキスト取得
      const context = phaseManager.getPhaseContext();

      // データが正しく設定されていることを確認
      expect(context.data).toMatchObject(contextData);
      expect(context.phaseId).toBe(phaseManager.getCurrentPhase().id);
      expect(context.turn).toBe(phaseManager.getCurrentTurn());
      expect(context.status).toBe('in_progress');
    });

    it('コンテキストデータを部分的に更新できること', () => {
      // 初期コンテキスト設定
      phaseManager.setPhaseContext({
        field1: 'value1',
        field2: 'value2'
      });

      // 部分的な更新
      phaseManager.updatePhaseContextData({
        field2: 'updated',
        field3: 'new'
      });

      // 更新後のコンテキスト取得
      const context = phaseManager.getPhaseContext();

      // 正しく更新されていることを確認
      expect(context.data).toMatchObject({
        field1: 'value1',   // 変更なし
        field2: 'updated',  // 更新された
        field3: 'new'       // 新規追加
      });
    });

    it('フェーズ終了時にコンテキストが完了状態になること', () => {
      // コンテキスト設定
      phaseManager.setPhaseContext({ test: true });

      // フェーズ遷移
      phaseManager.moveToNextPhase();

      // 前フェーズのコンテキスト取得
      const prevContext = phaseManager.getPreviousPhaseContext();

      // 完了状態になっていることを確認
      expect(prevContext.status).toBe('completed');
      expect(prevContext.endTime).toBeDefined();
    });
  });
});