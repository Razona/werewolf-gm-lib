/**
 * GameManagerAction.js の単体テスト
 *
 * このテストファイルでは、GameManagerActionモジュールの機能をテストします。
 * アクションの登録、実行、結果処理、特殊ルールの適用などの機能を検証します。
 */

// テスト環境設定
process.env.NODE_ENV = 'test';

// GameManagerとGameManagerActionMixinのインポート
import GameManager from '../../../../src/service/GameManager';
import GameManagerActionMixin from '../../../../src/service/GameManager/GameManagerAction';

// モジュールのモック化
jest.mock('../../../../src/core/event/EventSystem', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    emit: jest.fn()
  }));
});

jest.mock('../../../../src/core/error/ErrorHandler', () => {
  return jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
    createError: jest.fn((code, message) => ({
      code,
      message,
      toString: () => message
    }))
  }));
});

jest.mock('../../../../src/domain/player/PlayerManager', () => {
  return jest.fn().mockImplementation(() => ({
    addPlayer: jest.fn().mockReturnValue(0),
    removePlayer: jest.fn(),
    getPlayer: jest.fn().mockImplementation((id) => {
      if (id === 999) return null;
      if (id === 888) return { id: 888, name: 'DeadPlayer', isAlive: false };
      return { id, name: `Player${id}`, isAlive: true };
    }),
    getAllPlayers: jest.fn().mockReturnValue([
      { id: 0, name: 'Player0', isAlive: true },
      { id: 1, name: 'Player1', isAlive: true },
      { id: 2, name: 'Player2', isAlive: true }
    ]),
    getAlivePlayers: jest.fn().mockReturnValue([
      { id: 0, name: 'Player0', isAlive: true },
      { id: 1, name: 'Player1', isAlive: true },
      { id: 2, name: 'Player2', isAlive: true }
    ]),
    killPlayer: jest.fn(),
    setGuardStatus: jest.fn(),
    isGuarded: jest.fn().mockReturnValue({ guarded: false, guarderId: null })
  }));
});

jest.mock('../../../../src/domain/role/manager/RoleManager', () => {
  return jest.fn().mockImplementation(() => ({
    getRole: jest.fn().mockImplementation((id) => {
      if (id === 0) return { name: 'seer', team: 'village' };
      if (id === 1) return { name: 'knight', team: 'village' };
      if (id === 2) return { name: 'werewolf', team: 'werewolf' };
      if (id === 3) return { name: 'fox', team: 'fox' };
      return null;
    }),
    canUseAbility: jest.fn().mockReturnValue({ allowed: true }),
    getFortuneResult: jest.fn().mockImplementation((id) => {
      if (id === 2) return 'werewolf';
      if (id === 3) return 'fox';
      return 'village';
    }),
    getRolesWithNightAction: jest.fn().mockReturnValue([
      { playerId: 0, name: 'seer' },
      { playerId: 1, name: 'knight' },
      { playerId: 2, name: 'werewolf' }
    ])
  }));
});

jest.mock('../../../../src/domain/phase/PhaseManager', () => {
  return jest.fn().mockImplementation(() => ({
    getCurrentPhase: jest.fn().mockReturnValue({ id: 'night', name: '夜フェーズ' })
  }));
});

jest.mock('../../../../src/domain/action/ActionManager', () => {
  const mockActionManager = {
    registerAction: jest.fn().mockReturnValue({ actionId: 'act-1' }),
    executeActions: jest.fn().mockReturnValue([
      {
        action: { type: 'fortune', actor: 0, target: 1, night: 1 },
        success: true,
        outcome: { result: 'village' }
      }
    ]),
    getAction: jest.fn().mockImplementation((actionId) => {
      if (actionId === 'non-existent') return null;
      if (actionId === 'executed') return { id: 'executed', executed: true };
      return { id: actionId, executed: false };
    }),
    cancelAction: jest.fn().mockReturnValue(true),
    getRegisteredActions: jest.fn().mockReturnValue([]),
    getActionsByTurn: jest.fn().mockReturnValue([]),
    getPendingActionsCount: jest.fn().mockReturnValue(0),
    getActionResultsByActor: jest.fn().mockReturnValue([]),
    getActionResultsByTarget: jest.fn().mockReturnValue([])
  };
  return jest.fn().mockImplementation(() => mockActionManager);
});

// ユーティリティのモック
jest.mock('../../../../src/core/common/utils', () => ({
  SeededRandom: jest.fn().mockImplementation(() => ({
    random: jest.fn().mockReturnValue(0.5)
  })),
  Random: jest.fn().mockImplementation(() => ({
    random: jest.fn().mockReturnValue(0.5)
  }))
}));

describe('GameManagerAction', () => {
  let gameManager;
  let originalPrototype;

  beforeAll(() => {
    // GameManagerのプロトタイプを保存
    originalPrototype = { ...GameManager.prototype };

    // GameManagerActionMixinの適用
    GameManagerActionMixin(GameManager);
  });

  afterAll(() => {
    // テスト後にGameManagerのプロトタイプを復元
    Object.keys(GameManager.prototype).forEach(key => {
      if (!originalPrototype[key]) {
        delete GameManager.prototype[key];
      }
    });
    Object.keys(originalPrototype).forEach(key => {
      GameManager.prototype[key] = originalPrototype[key];
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    gameManager = new GameManager();

    // 状態を適切に設定
    gameManager.state = {
      ...gameManager.state,
      isStarted: true,
      turn: 1,
      phase: 'night'
    };

    // isGameStartedとisGameEndedメソッドがmixinによって上書きされていない場合のためのスタブ
    if (!gameManager.isGameStarted) {
      gameManager.isGameStarted = jest.fn().mockReturnValue(true);
    }
    if (!gameManager.isGameEnded) {
      gameManager.isGameEnded = jest.fn().mockReturnValue(false);
    }

    // GameManagerActionMixinにより追加されるメソッドのモック
    gameManager._validateActionState = jest.fn().mockReturnValue(true);
    gameManager._validateActionPermission = jest.fn().mockReturnValue({ valid: true });
    gameManager._applyFirstNightFortuneRule = jest.fn();
    gameManager._processActionResults = jest.fn();
    gameManager._handleAutomaticNightActions = jest.fn();
    gameManager.createStateSnapshot = jest.fn().mockReturnValue({});
    gameManager.restoreStateSnapshot = jest.fn();
  });

  // 1. registerActionメソッドのテスト
  describe('registerAction', () => {
    test('有効なアクションが正常に登録される', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };

      const result = gameManager.registerAction(action);

      expect(result).toEqual(expect.objectContaining({
        success: true,
        actionId: 'act-1'
      }));
      expect(gameManager.actionManager.registerAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fortune',
          actor: 0,
          target: 1,
          night: 1
        })
      );
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.register.before',
        expect.any(Object)
      );
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.register.after',
        expect.any(Object)
      );
    });

    test('ゲーム状態の検証が行われる', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };

      gameManager._validateActionState.mockClear();
      gameManager.registerAction(action);

      expect(gameManager._validateActionState).toHaveBeenCalled();
    });

    test('アクションのバリデーションが行われる', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };

      gameManager._validateActionPermission.mockClear();
      gameManager.registerAction(action);

      expect(gameManager._validateActionPermission).toHaveBeenCalledWith(action);
    });

    test('初日ターンでは初日占いルールが適用される', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };

      gameManager._applyFirstNightFortuneRule.mockClear();
      gameManager.registerAction(action);

      expect(gameManager._applyFirstNightFortuneRule).toHaveBeenCalledWith(action);
    });

    test('バリデーションに失敗した場合エラーが発生する', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };

      gameManager._validateActionPermission.mockReturnValueOnce({
        valid: false,
        code: 'E4004',
        message: '無効なアクションフォーマットです'
      });

      expect(() => {
        gameManager.registerAction(action);
      }).toThrow();

      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.error',
        expect.any(Object)
      );
    });

    test('すべてのアクションが登録されるとイベントが発火される', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };

      gameManager.actionManager.getPendingActionsCount.mockReturnValueOnce(0);

      gameManager.registerAction(action);

      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.all_registered',
        expect.any(Object)
      );
    });
  });

  // 2. executeActionsメソッドのテスト
  describe('executeActions', () => {
    test('アクションが正常に実行される', () => {
      const results = gameManager.executeActions();

      expect(results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          action: expect.objectContaining({
            type: 'fortune',
            actor: 0,
            target: 1
          }),
          success: true
        })
      ]));

      expect(gameManager.actionManager.executeActions).toHaveBeenCalledWith(gameManager.state.turn);
      expect(gameManager._processActionResults).toHaveBeenCalled();
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.execute.before',
        expect.any(Object)
      );
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.execute.after',
        expect.any(Object)
      );
    });

    test('ゲーム状態の検証が行われる', () => {
      gameManager._validateActionState.mockClear();
      gameManager.executeActions();

      expect(gameManager._validateActionState).toHaveBeenCalled();
    });

    test('未登録アクションの自動処理が行われる', () => {
      gameManager._handleAutomaticNightActions.mockClear();
      gameManager.executeActions();

      expect(gameManager._handleAutomaticNightActions).toHaveBeenCalled();
    });

    test('状態スナップショットが作成される', () => {
      gameManager.createStateSnapshot.mockClear();
      gameManager.executeActions();

      expect(gameManager.createStateSnapshot).toHaveBeenCalled();
    });

    test('実行エラー時には状態が復元される', () => {
      // エラーを発生させる
      gameManager.actionManager.executeActions.mockImplementationOnce(() => {
        throw new Error('実行エラー');
      });

      expect(() => {
        gameManager.executeActions();
      }).toThrow('実行エラー');

      expect(gameManager.restoreStateSnapshot).toHaveBeenCalled();
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.error',
        expect.any(Object)
      );
    });
  });

  // 3. _processActionResultsメソッドのテスト
  describe('_processActionResults', () => {
    beforeEach(() => {
      // プロトタイプから直接_processActionResultsを取り出す
      gameManager._processActionResults = GameManager.prototype._processActionResults.bind(gameManager);

      // 各タイプの処理メソッドをモック
      gameManager._processRoleActions = jest.fn();
    });

    test('結果配列が空の場合は何もしない', () => {
      gameManager._processRoleActions.mockClear();

      gameManager._processActionResults([]);

      expect(gameManager._processRoleActions).not.toHaveBeenCalled();
    });

    test('アクションタイプごとに結果が処理される', () => {
      const results = [
        { action: { type: 'fortune', actor: 0, target: 1 }, success: true },
        { action: { type: 'guard', actor: 1, target: 0 }, success: true },
        { action: { type: 'attack', actor: 2, target: 0 }, success: false }
      ];

      gameManager._processRoleActions.mockClear();

      gameManager._processActionResults(results);

      // 各タイプの処理メソッドが呼ばれることを確認
      expect(gameManager._processRoleActions).toHaveBeenCalledWith(
        'fortune',
        [results[0]]
      );
      expect(gameManager._processRoleActions).toHaveBeenCalledWith(
        'guard',
        [results[1]]
      );
      expect(gameManager._processRoleActions).toHaveBeenCalledWith(
        'attack',
        [results[2]]
      );
    });

    test('定義された処理順序でアクションが処理される', () => {
      const results = [
        { action: { type: 'attack', actor: 2, target: 0 }, success: true },
        { action: { type: 'fortune', actor: 0, target: 1 }, success: true },
        { action: { type: 'guard', actor: 1, target: 0 }, success: true }
      ];

      const callOrder = [];
      gameManager._processRoleActions.mockImplementation((type) => {
        callOrder.push(type);
      });

      gameManager._processActionResults(results);

      // 期待する順序: fortune -> guard -> attack
      expect(callOrder).toEqual(['fortune', 'guard', 'attack']);
    });
  });

  // 4. _processFoxCurseメソッドのテスト
  describe('_processFoxCurse', () => {
    beforeEach(() => {
      // プロトタイプから直接_processFoxCurseを取り出す
      gameManager._processFoxCurse = GameManager.prototype._processFoxCurse.bind(gameManager);
    });

    test('対象が狐で生存している場合に呪殺が発生する', () => {
      // 狐のプレイヤーをモック
      gameManager.getPlayer = jest.fn().mockReturnValue({
        id: 3,
        name: 'FoxPlayer',
        isAlive: true
      });

      const result = gameManager._processFoxCurse(3, 0);

      expect(result).toBe(true);
      expect(gameManager.killPlayer).toHaveBeenCalledWith(3, 'fox_curse');
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'player.cursed',
        expect.objectContaining({
          playerId: 3,
          curseSource: 0
        })
      );
    });

    test('対象が狐でない場合は呪殺が発生しない', () => {
      // 村人のプレイヤーをモック
      gameManager.getPlayer = jest.fn().mockReturnValue({
        id: 1,
        name: 'VillagerPlayer',
        isAlive: true
      });

      const result = gameManager._processFoxCurse(1, 0);

      expect(result).toBe(false);
      expect(gameManager.killPlayer).not.toHaveBeenCalled();
    });

    test('対象が死亡している場合は呪殺が発生しない', () => {
      // 死亡した狐のプレイヤーをモック
      gameManager.getPlayer = jest.fn().mockReturnValue({
        id: 3,
        name: 'DeadFoxPlayer',
        isAlive: false
      });

      const result = gameManager._processFoxCurse(3, 0);

      expect(result).toBe(false);
      expect(gameManager.killPlayer).not.toHaveBeenCalled();
    });
  });

  // 5. _checkConsecutiveGuardRuleメソッドのテスト
  describe('_checkConsecutiveGuardRule', () => {
    beforeEach(() => {
      // プロトタイプから直接_checkConsecutiveGuardRuleを取り出す
      gameManager._checkConsecutiveGuardRule = GameManager.prototype._checkConsecutiveGuardRule.bind(gameManager);
    });

    test('連続ガード許可設定の場合は常にtrueを返す', () => {
      gameManager.options.regulations.allowConsecutiveGuard = true;

      const result = gameManager._checkConsecutiveGuardRule(1, 0);

      expect(result).toBe(true);
    });

    test('前回ガードしていない場合はtrueを返す', () => {
      gameManager.options.regulations.allowConsecutiveGuard = false;
      gameManager.actionManager.getActionsByTurn.mockReturnValueOnce([]);

      const result = gameManager._checkConsecutiveGuardRule(1, 0);

      expect(result).toBe(true);
    });

    test('前回と異なる対象へのガードの場合はtrueを返す', () => {
      gameManager.options.regulations.allowConsecutiveGuard = false;
      gameManager.actionManager.getActionsByTurn.mockReturnValueOnce([
        { type: 'guard', actor: 1, target: 2 }
      ]);

      const result = gameManager._checkConsecutiveGuardRule(1, 0);

      expect(result).toBe(true);
    });

    test('前回と同じ対象へのガードの場合はfalseを返す', () => {
      gameManager.options.regulations.allowConsecutiveGuard = false;
      gameManager.actionManager.getActionsByTurn.mockReturnValueOnce([
        { type: 'guard', actor: 1, target: 0 }
      ]);

      const result = gameManager._checkConsecutiveGuardRule(1, 0);

      expect(result).toBe(false);
    });
  });

  // 6. 自動アクション生成メソッドのテスト
  describe('自動アクション生成', () => {
    beforeEach(() => {
      // プロトタイプからメソッドを取り出す
      gameManager._createRandomFortuneAction = GameManager.prototype._createRandomFortuneAction.bind(gameManager);
      gameManager._createRandomGuardAction = GameManager.prototype._createRandomGuardAction.bind(gameManager);
      gameManager._createRandomAttackAction = GameManager.prototype._createRandomAttackAction.bind(gameManager);
    });

    test('_createRandomFortuneActionは有効な占いアクションを生成する', () => {
      const action = gameManager._createRandomFortuneAction(0);

      expect(action).toEqual({
        type: 'fortune',
        actor: 0,
        target: expect.any(Number)
      });
      expect(action.target).not.toBe(0); // 自分自身以外を対象に選択
    });

    test('_createRandomGuardActionは有効な護衛アクションを生成する', () => {
      gameManager._checkConsecutiveGuardRule = jest.fn().mockReturnValue(true);

      const action = gameManager._createRandomGuardAction(1);

      expect(action).toEqual({
        type: 'guard',
        actor: 1,
        target: expect.any(Number)
      });
      expect(action.target).not.toBe(1); // 自分自身以外を対象に選択
    });

    test('_createRandomAttackActionは有効な襲撃アクションを生成する', () => {
      const action = gameManager._createRandomAttackAction(2);

      expect(action).toEqual({
        type: 'attack',
        actor: 2,
        target: expect.any(Number)
      });
      expect(action.target).not.toBe(2); // 自分自身以外を対象に選択
    });

    test('対象候補がない場合はnullを返す', () => {
      // 生存プレイヤーが自分だけの状況をモック
      gameManager.getAlivePlayers = jest.fn().mockReturnValue([
        { id: 0, name: 'Player0', isAlive: true }
      ]);

      const action = gameManager._createRandomFortuneAction(0);

      expect(action).toBeNull();
    });
  });

  // 7. _handleAutomaticNightActionsメソッドのテスト
  describe('_handleAutomaticNightActions', () => {
    beforeEach(() => {
      // プロトタイプから直接_handleAutomaticNightActionsを取り出す
      gameManager._handleAutomaticNightActions = GameManager.prototype._handleAutomaticNightActions.bind(gameManager);

      // 自動アクション生成メソッドのモック
      gameManager._createRandomFortuneAction = jest.fn().mockReturnValue({ type: 'fortune', actor: 0, target: 1 });
      gameManager._createRandomGuardAction = jest.fn().mockReturnValue({ type: 'guard', actor: 1, target: 0 });
      gameManager._createRandomAttackAction = jest.fn().mockReturnValue({ type: 'attack', actor: 2, target: 0 });

      // registerActionのモック
      gameManager.registerAction = jest.fn().mockReturnValue({ success: true, actionId: 'auto-act' });
    });

    test('未登録アクションに対して自動処理が行われる', () => {
      // 登録済みアクション（人狼のみ）
      gameManager.actionManager.getRegisteredActions.mockReturnValueOnce([
        { type: 'attack', actor: 2, target: 0 }
      ]);

      gameManager._handleAutomaticNightActions();

      // 占い師と騎士の未登録アクションに対して自動生成と登録が行われる
      expect(gameManager._createRandomFortuneAction).toHaveBeenCalledWith(0);
      expect(gameManager._createRandomGuardAction).toHaveBeenCalledWith(1);
      expect(gameManager._createRandomAttackAction).not.toHaveBeenCalled(); // 登録済みなので呼ばれない

      // 自動生成されたアクションが登録される
      expect(gameManager.registerAction).toHaveBeenCalledTimes(2);
      expect(gameManager.registerAction).toHaveBeenCalledWith({ type: 'fortune', actor: 0, target: 1 });
      expect(gameManager.registerAction).toHaveBeenCalledWith({ type: 'guard', actor: 1, target: 0 });

      // 自動実行イベントが発火される
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.auto_executed',
        expect.any(Object)
      );
    });

    test('死亡したプレイヤーのアクションは自動処理されない', () => {
      // プレイヤー0が死亡している状況をモック
      gameManager.getPlayer = jest.fn().mockImplementation((id) => {
        if (id === 0) return { id: 0, name: 'Player0', isAlive: false };
        return { id, name: `Player${id}`, isAlive: true };
      });

      // 登録済みアクションなし
      gameManager.actionManager.getRegisteredActions.mockReturnValueOnce([]);

      gameManager._handleAutomaticNightActions();

      // 死亡した占い師のアクションは生成されない
      expect(gameManager._createRandomFortuneAction).not.toHaveBeenCalled();
      // 生存している騎士と人狼のアクションは生成される
      expect(gameManager._createRandomGuardAction).toHaveBeenCalledWith(1);
      expect(gameManager._createRandomAttackAction).toHaveBeenCalledWith(2);
    });

    test('自動アクション生成が失敗しても処理は続行される', () => {
      // 占い師のアクション生成が失敗する状況をモック
      gameManager._createRandomFortuneAction.mockReturnValueOnce(null);

      // 登録済みアクションなし
      gameManager.actionManager.getRegisteredActions.mockReturnValueOnce([]);

      gameManager._handleAutomaticNightActions();

      // 占い師のアクションは登録されない
      expect(gameManager.registerAction).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'fortune' }));
      // 他のアクションは通常通り登録される
      expect(gameManager.registerAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'guard' }));
      expect(gameManager.registerAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'attack' }));
    });
  });

  // 8. _processFortuneResultメソッドのテスト
  describe('_processFortuneResult', () => {
    beforeEach(() => {
      // プロトタイプから直接_processFortuneResultを取り出す
      gameManager._processFortuneResult = GameManager.prototype._processFortuneResult.bind(gameManager);

      // 占い師と対象プレイヤーのモック
      gameManager.getPlayer = jest.fn().mockImplementation((id) => {
        if (id === 0) return { id: 0, name: 'SeerPlayer', isAlive: true, fortuneResults: [] };
        if (id === 1) return { id: 1, name: 'VillagerPlayer', isAlive: true };
        if (id === 2) return { id: 2, name: 'WerewolfPlayer', isAlive: true };
        if (id === 3) return { id: 3, name: 'FoxPlayer', isAlive: true };
        return null;
      });

      // 呪殺処理のモック
      gameManager._processFoxCurse = jest.fn().mockReturnValue(false);
    });

    test('占い結果が正しく保存される', () => {
      const result = {
        action: { type: 'fortune', actor: 0, target: 1 },
        success: true,
        outcome: { result: 'village' }
      };

      gameManager._processFortuneResult(result);

      // 占い師のプレイヤーオブジェクトを取得
      const seerPlayer = gameManager.getPlayer(0);

      // 結果が保存されたことを確認
      expect(seerPlayer.fortuneResults).toContainEqual({
        turn: 1,
        targetId: 1,
        result: 'village',
        targetName: 'VillagerPlayer'
      });

      // イベントが発火されたことを確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.fortune.result',
        expect.objectContaining({
          actorId: 0,
          targetId: 1,
          result: 'village'
        })
      );
    });

    test('結果が指定されていない場合は計算される', () => {
      const result = {
        action: { type: 'fortune', actor: 0, target: 2 },
        success: true
      };

      gameManager._processFortuneResult(result);

      // 占い師のプレイヤーオブジェクトを取得
      const seerPlayer = gameManager.getPlayer(0);

      // RoleManagerから計算された結果が保存されたことを確認
      expect(seerPlayer.fortuneResults).toContainEqual({
        turn: 1,
        targetId: 2,
        result: 'werewolf',
        targetName: 'WerewolfPlayer'
      });
    });

    test('狐への占いは呪殺処理が呼ばれる', () => {
      const result = {
        action: { type: 'fortune', actor: 0, target: 3 },
        success: true
      };
      gameManager._processFoxCurse.mockClear();

      gameManager._processFortuneResult(result);

      // 呪殺処理が呼ばれたことを確認
      expect(gameManager._processFoxCurse).toHaveBeenCalledWith(3, 0);

      // 呪殺結果がイベントに含まれることを確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.fortune.result',
        expect.objectContaining({
          foxCursed: false
        })
      );
    });

    test('無効な結果やアクションは処理されない', () => {
      // 失敗した占いアクション
      const failedResult = {
        action: { type: 'fortune', actor: 0, target: 1 },
        success: false
      };

      gameManager._processFortuneResult(failedResult);

      // 占い師のプレイヤーオブジェクトを取得
      const seerPlayer = gameManager.getPlayer(0);

      // 結果が保存されないことを確認
      expect(seerPlayer.fortuneResults).toEqual([]);

      // イベントが発火されないことを確認
      expect(gameManager.eventSystem.emit).not.toHaveBeenCalledWith(
        'action.fortune.result',
        expect.any(Object)
      );
    });
  });

  // 9. _processGuardResultメソッドのテスト
  describe('_processGuardResult', () => {
    beforeEach(() => {
      // プロトタイプから直接_processGuardResultを取り出す
      gameManager._processGuardResult = GameManager.prototype._processGuardResult.bind(gameManager);

      // 騎士と対象プレイヤーのモック
      gameManager.getPlayer = jest.fn().mockImplementation((id) => {
        if (id === 0) return { id: 0, name: 'TargetPlayer', isAlive: true, statusEffects: [] };
        if (id === 1) return { id: 1, name: 'KnightPlayer', isAlive: true, guardHistory: [] };
        return null;
      });
    });

    test('護衛状態が正しく設定される', () => {
      const result = {
        action: { type: 'guard', actor: 1, target: 0 },
        success: true
      };

      gameManager._processGuardResult(result);

      // 護衛状態設定メソッドが呼ばれたか確認
      expect(gameManager.playerManager.setGuardStatus).toHaveBeenCalledWith(0, 1);

      // 護衛イベントが発火されたか確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'player.guarded',
        expect.objectContaining({
          playerId: 0,
          guardedBy: 1
        })
      );
    });

    test('専用メソッドがない場合は状態効果として設定される', () => {
      // setGuardStatusメソッドがない状況をシミュレート
      delete gameManager.playerManager.setGuardStatus;

      const result = {
        action: { type: 'guard', actor: 1, target: 0 },
        success: true
      };

      gameManager._processGuardResult(result);

      // 対象プレイヤーのstatusEffectsに追加されるか確認
      const targetPlayer = gameManager.getPlayer(0);
      expect(targetPlayer.statusEffects).toContainEqual({
        type: 'guarded',
        by: 1,
        turn: 1
      });
    });

    test('護衛履歴が正しく更新される', () => {
      const result = {
        action: { type: 'guard', actor: 1, target: 0 },
        success: true
      };

      gameManager._processGuardResult(result);

      // 騎士のプレイヤーオブジェクトを取得
      const knightPlayer = gameManager.getPlayer(1);

      // 護衛履歴が更新されたことを確認
      expect(knightPlayer.guardHistory).toContainEqual({
        turn: 1,
        targetId: 0,
        targetName: 'TargetPlayer'
      });
    });
  });

  // 10. _processAttackResultメソッドのテスト
  describe('_processAttackResult', () => {
    beforeEach(() => {
      // プロトタイプから直接_processAttackResultを取り出す
      gameManager._processAttackResult = GameManager.prototype._processAttackResult.bind(gameManager);

      // プレイヤーのモック
      gameManager.getPlayer = jest.fn().mockImplementation((id) => {
        if (id === 0) return { id: 0, name: 'TargetPlayer', isAlive: true };
        if (id === 1) return { id: 1, name: 'GuardedPlayer', isAlive: true };
        if (id === 2) return { id: 2, name: 'WerewolfPlayer', isAlive: true };
        if (id === 3) return { id: 3, name: 'FoxPlayer', isAlive: true };
        return null;
      });

      // 役職情報のモック
      gameManager.roleManager.getRole
        .mockReturnValueOnce(null) // id=0: 通常村人
        .mockReturnValueOnce(null) // id=1: 通常村人（護衛済み）
        .mockReturnValueOnce({ name: 'werewolf', team: 'werewolf' }) // id=2: 人狼
        .mockReturnValueOnce({ name: 'fox', team: 'fox' }); // id=3: 狐
    });

    test('護衛されていない対象への襲撃は成功する', () => {
      const result = {
        action: { type: 'attack', actor: 2, target: 0 },
        success: true
      };

      gameManager._processAttackResult(result);

      // 対象プレイヤーが殺されることを確認
      expect(gameManager.killPlayer).toHaveBeenCalledWith(0, 'werewolf_attack');

      // 襲撃成功イベントが発火されることを確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.attack.success',
        expect.objectContaining({
          targetId: 0,
          attackerId: 2
        })
      );
    });

    test('護衛された対象への襲撃は失敗する', () => {
      // 護衛状態をモック
      gameManager.playerManager.isGuarded.mockReturnValueOnce({ guarded: true, guarderId: 4 });

      const result = {
        action: { type: 'attack', actor: 2, target: 1 },
        success: true
      };

      gameManager._processAttackResult(result);

      // 対象プレイヤーが殺されないことを確認
      expect(gameManager.killPlayer).not.toHaveBeenCalled();

      // 護衛成功イベントが発火されることを確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'player.guard.success',
        expect.objectContaining({
          targetId: 1,
          guarderId: 4
        })
      );

      // 襲撃失敗イベントが発火されることを確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'player.attack.failed',
        expect.objectContaining({
          targetId: 1,
          reason: 'guarded'
        })
      );
    });

    test('狐への襲撃は失敗する', () => {
      const result = {
        action: { type: 'attack', actor: 2, target: 3 },
        success: true
      };

      gameManager._processAttackResult(result);

      // 対象プレイヤーが殺されないことを確認
      expect(gameManager.killPlayer).not.toHaveBeenCalled();

      // 襲撃耐性イベントが発火されることを確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'player.attack.immune',
        expect.objectContaining({
          playerId: 3,
          reason: 'fox_immunity'
        })
      );

      // 襲撃失敗イベントが発火されることを確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'player.attack.failed',
        expect.objectContaining({
          targetId: 3,
          reason: 'target_immune'
        })
      );
    });

    test('明示的な失敗結果の場合は失敗イベントのみ発火される', () => {
      const result = {
        action: { type: 'attack', actor: 2, target: 0 },
        success: false,
        reason: 'custom_reason'
      };

      gameManager._processAttackResult(result);

      // 対象プレイヤーが殺されないことを確認
      expect(gameManager.killPlayer).not.toHaveBeenCalled();

      // 襲撃失敗イベントのみ発火されることを確認
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'player.attack.failed',
        expect.objectContaining({
          targetId: 0,
          reason: 'custom_reason'
        })
      );
    });
  });

  // 11. getActionResultsメソッドのテスト
  describe('getActionResults', () => {
    beforeEach(() => {
      // アクション結果のモック
      gameManager.actionManager.getActionResultsByActor.mockReturnValue([
        {
          action: { type: 'fortune', actor: 0, target: 1, night: 1 },
          success: true,
          outcome: { result: 'village' }
        }
      ]);

      gameManager.actionManager.getActionResultsByTarget.mockReturnValue([
        {
          action: { type: 'attack', actor: 2, target: 0, night: 1 },
          success: false,
          outcome: { reason: 'guarded' }
        }
      ]);
    });

    test('アクターとしての結果が取得できる', () => {
      const results = gameManager.getActionResults(0, { asActor: true, asTarget: false });

      expect(results).toEqual([
        expect.objectContaining({
          turn: 1,
          type: 'fortune',
          role: 'actor',
          targetId: 1,
          result: { result: 'village' }
        })
      ]);

      expect(gameManager.actionManager.getActionResultsByActor).toHaveBeenCalledWith(0, null);
    });

    test('ターゲットとしての結果が取得できる', () => {
      const results = gameManager.getActionResults(0, { asActor: false, asTarget: true });

      expect(results).toEqual([
        expect.objectContaining({
          turn: 1,
          type: 'attack',
          role: 'target',
          actorId: 2,
          result: { reason: 'guarded' }
        })
      ]);

      expect(gameManager.actionManager.getActionResultsByTarget).toHaveBeenCalledWith(0, null);
    });

    test('両方の役割での結果が取得できる', () => {
      const results = gameManager.getActionResults(0);

      expect(results).toHaveLength(2);
      expect(results).toContainEqual(
        expect.objectContaining({
          role: 'actor',
          type: 'fortune'
        })
      );
      expect(results).toContainEqual(
        expect.objectContaining({
          role: 'target',
          type: 'attack'
        })
      );
    });

    test('特定ターンのみの結果でフィルタリングできる', () => {
      gameManager.getActionResults(0, { turn: 1 });

      expect(gameManager.actionManager.getActionResultsByActor).toHaveBeenCalledWith(0, 1);
      expect(gameManager.actionManager.getActionResultsByTarget).toHaveBeenCalledWith(0, 1);
    });

    test('ゲーム未開始時にはエラーが発生する', () => {
      gameManager.isGameStarted.mockReturnValueOnce(false);

      expect(() => {
        gameManager.getActionResults(0);
      }).toThrow();
    });

    test('存在しないプレイヤーIDではエラーが発生する', () => {
      gameManager.getPlayer.mockReturnValueOnce(null);

      expect(() => {
        gameManager.getActionResults(999);
      }).toThrow();
    });
  });

  // 12. getActionsByTurnメソッドのテスト
  describe('getActionsByTurn', () => {
    test('指定したターンのアクションが取得できる', () => {
      const mockActions = [
        { type: 'fortune', actor: 0, target: 1, night: 1 },
        { type: 'guard', actor: 1, target: 0, night: 1 }
      ];

      gameManager.actionManager.getActionsByTurn.mockReturnValueOnce(mockActions);

      const actions = gameManager.getActionsByTurn(1);

      expect(actions).toEqual(mockActions);
      expect(gameManager.actionManager.getActionsByTurn).toHaveBeenCalledWith(1);
    });

    test('ゲーム未開始時にはエラーが発生する', () => {
      gameManager.isGameStarted.mockReturnValueOnce(false);

      expect(() => {
        gameManager.getActionsByTurn(1);
      }).toThrow();
    });

    test('無効なターン番号ではエラーが発生する', () => {
      // 現在のターンは1
      expect(() => {
        gameManager.getActionsByTurn(0); // 0は無効
      }).toThrow();

      expect(() => {
        gameManager.getActionsByTurn(2); // 現在のターンより大きい値は無効
      }).toThrow();

      expect(() => {
        gameManager.getActionsByTurn('invalid'); // 数値以外は無効
      }).toThrow();
    });
  });

  // 13. cancelActionメソッドのテスト
  describe('cancelAction', () => {
    test('アクションが正常にキャンセルされる', () => {
      const result = gameManager.cancelAction('act-1');

      expect(result).toEqual(expect.objectContaining({
        success: true,
        actionId: 'act-1'
      }));

      expect(gameManager.actionManager.cancelAction).toHaveBeenCalledWith('act-1');
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.cancel.before',
        expect.any(Object)
      );
      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.cancel.after',
        expect.any(Object)
      );
    });

    test('キャンセル理由を指定できる', () => {
      gameManager.cancelAction('act-1', 'custom_reason');

      expect(gameManager.eventSystem.emit).toHaveBeenCalledWith(
        'action.cancel.before',
        expect.objectContaining({
          reason: 'custom_reason'
        })
      );
    });

    test('代替アクションの候補が提案される', () => {
      // アクション情報のモック
      gameManager.actionManager.getAction.mockReturnValueOnce({
        id: 'act-1',
        type: 'fortune',
        actor: 0,
        target: 1,
        executed: false
      });

      // 生存プレイヤーのモック
      gameManager.getAlivePlayers.mockReturnValueOnce([
        { id: 0, name: 'Player0', isAlive: true },
        { id: 1, name: 'Player1', isAlive: true },
        { id: 2, name: 'Player2', isAlive: true }
      ]);

      const result = gameManager.cancelAction('act-1');

      expect(result.alternatives).toEqual(expect.arrayContaining([
        expect.objectContaining({
          type: 'fortune',
          targets: expect.arrayContaining([
            { id: 1, name: 'Player1' },
            { id: 2, name: 'Player2' }
          ])
        })
      ]));
    });

    test('ゲーム未開始時にはエラーが発生する', () => {
      gameManager.isGameStarted.mockReturnValueOnce(false);

      expect(() => {
        gameManager.cancelAction('act-1');
      }).toThrow();
    });

    test('存在しないアクションIDではエラーが発生する', () => {
      gameManager.actionManager.getAction.mockReturnValueOnce(null);

      expect(() => {
        gameManager.cancelAction('non-existent');
      }).toThrow();
    });

    test('実行済みのアクションはキャンセルできない', () => {
      gameManager.actionManager.getAction.mockReturnValueOnce({
        id: 'executed',
        executed: true
      });

      expect(() => {
        gameManager.cancelAction('executed');
      }).toThrow();
    });
  });

  // 14. getFortuneResultメソッドのテスト
  describe('getFortuneResult', () => {
    test('対象プレイヤーの占い結果を取得できる', () => {
      const result = gameManager.getFortuneResult(2);

      expect(result).toBe('werewolf');
      expect(gameManager.roleManager.getFortuneResult).toHaveBeenCalledWith(2);
    });

    test('ゲーム未開始時にはエラーが発生する', () => {
      gameManager.isGameStarted.mockReturnValueOnce(false);

      expect(() => {
        gameManager.getFortuneResult(1);
      }).toThrow();
    });

    test('存在しないプレイヤーIDではエラーが発生する', () => {
      gameManager.getPlayer.mockReturnValueOnce(null);

      expect(() => {
        gameManager.getFortuneResult(999);
      }).toThrow();
    });
  });

  // 15. _validateActionState メソッドのテスト
  describe('_validateActionState', () => {
    beforeEach(() => {
      // プロトタイプから直接メソッドを取り出してオリジナルの実装を使用
      gameManager._validateActionState = GameManager.prototype._validateActionState.bind(gameManager);
    });

    test('ゲーム開始状態では検証を通過する', () => {
      gameManager.isGameStarted.mockReturnValueOnce(true);
      gameManager.isGameEnded.mockReturnValueOnce(false);
      gameManager.getCurrentPhase.mockReturnValueOnce({ id: 'night' });

      const result = gameManager._validateActionState();

      expect(result).toBe(true);
    });

    test('ゲーム未開始時にはエラーが発生する', () => {
      gameManager.isGameStarted.mockReturnValueOnce(false);

      expect(() => {
        gameManager._validateActionState();
      }).toThrow();

      expect(gameManager.errorHandler.createError).toHaveBeenCalledWith(
        'E4001',
        'GAME_NOT_STARTED',
        expect.any(String)
      );
    });

    test('ゲーム終了時にはエラーが発生する', () => {
      gameManager.isGameStarted.mockReturnValueOnce(true);
      gameManager.isGameEnded.mockReturnValueOnce(true);

      expect(() => {
        gameManager._validateActionState();
      }).toThrow();

      expect(gameManager.errorHandler.createError).toHaveBeenCalledWith(
        'E4002',
        'GAME_ALREADY_ENDED',
        expect.any(String)
      );
    });

    test('夜フェーズ以外ではエラーが発生する', () => {
      gameManager.isGameStarted.mockReturnValueOnce(true);
      gameManager.isGameEnded.mockReturnValueOnce(false);
      gameManager.getCurrentPhase.mockReturnValueOnce({ id: 'day' });

      expect(() => {
        gameManager._validateActionState();
      }).toThrow();

      expect(gameManager.errorHandler.createError).toHaveBeenCalledWith(
        'E4003',
        'INVALID_PHASE',
        expect.any(String)
      );
    });
  });

  // 16. _validateActionPermission メソッドのテスト
  describe('_validateActionPermission', () => {
    beforeEach(() => {
      // プロトタイプから直接メソッドを取り出してオリジナルの実装を使用
      gameManager._validateActionPermission = GameManager.prototype._validateActionPermission.bind(gameManager);
    });

    test('有効なアクションでは検証を通過する', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };

      // アクターと対象プレイヤーのモック
      gameManager.getPlayer
        .mockReturnValueOnce({ id: 0, name: 'SeerPlayer', isAlive: true }) // actor
        .mockReturnValueOnce({ id: 1, name: 'TargetPlayer', isAlive: true }); // target

      // 役職能力のモック
      gameManager.roleManager.canUseAbility.mockReturnValueOnce({ allowed: true });

      const result = gameManager._validateActionPermission(action);

      expect(result).toEqual({ valid: true });
    });

    test('無効なアクションフォーマットではエラーが返される', () => {
      const invalidActions = [
        null,
        {},
        { actor: 0, target: 1 }, // typeなし
        { type: 'fortune', target: 1 }, // actorなし
        { type: 'fortune', actor: 0 }, // targetなし
        { type: 'fortune', actor: '0', target: 1 }, // 数値でないactor
        { type: 'fortune', actor: 0, target: '1' } // 数値でないtarget
      ];

      invalidActions.forEach(action => {
        const result = gameManager._validateActionPermission(action);
        expect(result).toEqual({
          valid: false,
          code: 'E4004',
          message: '無効なアクションフォーマットです'
        });
      });
    });

    test('存在しないアクターではエラーが返される', () => {
      const action = { type: 'fortune', actor: 999, target: 1 };

      // 存在しないプレイヤー
      gameManager.getPlayer.mockReturnValueOnce(null);

      const result = gameManager._validateActionPermission(action);

      expect(result).toEqual({
        valid: false,
        code: 'E4005',
        message: '指定されたアクション実行者が存在しません'
      });
    });

    test('死亡したアクターではエラーが返される', () => {
      const action = { type: 'fortune', actor: 888, target: 1 };

      // 死亡したプレイヤー
      gameManager.getPlayer.mockReturnValueOnce({ id: 888, name: 'DeadPlayer', isAlive: false });

      const result = gameManager._validateActionPermission(action);

      expect(result).toEqual({
        valid: false,
        code: 'E4005',
        message: '死亡したプレイヤーはアクションを実行できません'
      });
    });

    test('存在しない対象ではエラーが返される', () => {
      const action = { type: 'fortune', actor: 0, target: 999 };

      // アクター
      gameManager.getPlayer.mockReturnValueOnce({ id: 0, name: 'SeerPlayer', isAlive: true });
      // 存在しない対象
      gameManager.getPlayer.mockReturnValueOnce(null);

      const result = gameManager._validateActionPermission(action);

      expect(result).toEqual({
        valid: false,
        code: 'E4006',
        message: '指定されたアクション対象が存在しません'
      });
    });

    test('死亡した対象ではエラーが返される（通常役職）', () => {
      const action = { type: 'fortune', actor: 0, target: 888 };

      // アクター
      gameManager.getPlayer.mockReturnValueOnce({ id: 0, name: 'SeerPlayer', isAlive: true });
      // 死亡した対象
      gameManager.getPlayer.mockReturnValueOnce({ id: 888, name: 'DeadPlayer', isAlive: false });

      const result = gameManager._validateActionPermission(action);

      expect(result).toEqual({
        valid: false,
        code: 'E4006',
        message: '死亡したプレイヤーはアクションの対象になれません'
      });
    });

    test('役職能力が許可されていない場合はエラーが返される', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };

      // アクター
      gameManager.getPlayer.mockReturnValueOnce({ id: 0, name: 'SeerPlayer', isAlive: true });
      // 対象
      gameManager.getPlayer.mockReturnValueOnce({ id: 1, name: 'TargetPlayer', isAlive: true });
      // 能力使用不可
      gameManager.roleManager.canUseAbility.mockReturnValueOnce({
        allowed: false,
        reason: '能力使用条件を満たしていません'
      });

      const result = gameManager._validateActionPermission(action);

      expect(result).toEqual({
        valid: false,
        code: 'E4007',
        message: '能力使用条件を満たしていません'
      });
    });

    test('連続ガード禁止ルールではエラーが返される', () => {
      const action = { type: 'guard', actor: 1, target: 0 };

      // アクター
      gameManager.getPlayer.mockReturnValueOnce({ id: 1, name: 'KnightPlayer', isAlive: true });
      // 対象
      gameManager.getPlayer.mockReturnValueOnce({ id: 0, name: 'TargetPlayer', isAlive: true });
      // 能力使用可能
      gameManager.roleManager.canUseAbility.mockReturnValueOnce({ allowed: true });
      // 連続ガード禁止
      gameManager._checkConsecutiveGuardRule.mockReturnValueOnce(false);

      const result = gameManager._validateActionPermission(action);

      expect(result).toEqual({
        valid: false,
        code: 'E4008',
        message: '同じ対象を連続して護衛することはできません'
      });
    });
  });
});