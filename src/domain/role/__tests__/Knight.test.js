/**
 * 騎士（Knight）役職クラスのテスト
 */

describe('Knight', () => {
  // クラスのインポート
  let Knight;
  let Village;

  // モック依存関係
  const mockEventEmit = jest.fn();
  const mockEventOn = jest.fn();
  const mockGame = {
    eventSystem: {
      emit: mockEventEmit,
      on: mockEventOn
    },
    phaseManager: {
      getCurrentTurn: jest.fn().mockReturnValue(1)
    },
    getPlayer: jest.fn(),
    getPlayersByRole: jest.fn().mockReturnValue([]),
    getAlivePlayers: jest.fn().mockReturnValue([])
  };

  beforeEach(() => {
    // テスト間でモジュールキャッシュをクリアして新しいインポートを保証
    jest.resetModules();
    jest.clearAllMocks();

    // モック呼び出し履歴をクリア
    mockEventEmit.mockClear();
    mockEventOn.mockClear();

    // Knightクラスをインポート
    Knight = require('../Knight').Knight;
    Village = require('../Village').Village;

    // デフォルトのモック設定
    mockGame.getPlayer.mockImplementation((id) => {
      if (id === 1) return { id: 1, name: 'Knight', role: { name: 'knight' }, isAlive: true };
      if (id === 2) return { id: 2, name: 'Target1', role: { name: 'villager' }, isAlive: true };
      if (id === 3) return { id: 3, name: 'Target2', role: { name: 'werewolf' }, isAlive: true };
      return null;
    });

    mockGame.getAlivePlayers.mockReturnValue([
      { id: 1, name: 'Knight', role: { name: 'knight' }, isAlive: true },
      { id: 2, name: 'Target1', role: { name: 'villager' }, isAlive: true },
      { id: 3, name: 'Target2', role: { name: 'werewolf' }, isAlive: true }
    ]);
  });

  describe('初期化', () => {
    test('Villageクラスを継承していること', () => {
      const knight = new Knight(mockGame);
      expect(knight).toBeInstanceOf(Village);
    });

    test('正しいプロパティで初期化されること', () => {
      const knight = new Knight(mockGame);

      expect(knight.name).toBe('knight');
      expect(knight.displayName).toBe('騎士');
      expect(knight.team).toBe('village');
      expect(knight.lastGuardedId).toBeNull();

      // メタデータ
      expect(knight.metadata.description).toContain('騎士');
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultは"white"を返すこと', () => {
      const knight = new Knight(mockGame);
      expect(knight.getFortuneResult()).toBe('white');
    });

    test('getMediumResultは"white"を返すこと', () => {
      const knight = new Knight(mockGame);
      expect(knight.getMediumResult()).toBe('white');
    });
  });

  describe('能力メソッド', () => {
    test('canUseAbilityは生存していればtrueを返すこと', () => {
      const knight = new Knight(mockGame);
      knight.isAlive = true;

      expect(knight.canUseAbility(1)).toBe(true);
    });

    test('canUseAbilityは死亡していればfalseを返すこと', () => {
      const knight = new Knight(mockGame);
      knight.isAlive = false;

      expect(knight.canUseAbility(1)).toBe(false);
    });

    test('getAbilityTargetsは前回と同じ対象が選べないこと', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);
      knight.lastGuardedId = 2;

      // ゲーム設定で連続ガード禁止を有効化
      mockGame.options = {
        regulations: {
          allowConsecutiveGuard: false
        }
      };

      const targets = knight.getAbilityTargets();

      expect(targets).toEqual([3]); // ID 2は前回のため除外
    });

    test('getAbilityTargetsは連続ガード許可設定の場合は前回と同じ対象も選べること', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);
      knight.lastGuardedId = 2;

      // ゲーム設定で連続ガード許可を有効化
      mockGame.options = {
        regulations: {
          allowConsecutiveGuard: true
        }
      };

      const targets = knight.getAbilityTargets();

      expect(targets).toEqual([2, 3]); // ID 2も含まれる
    });

    test('getAbilityTargetsは自分自身を含まないこと', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);

      const targets = knight.getAbilityTargets();

      expect(targets).not.toContain(1);
    });

    test('guardは護衛アクションを登録すること', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);

      // ActionIDを生成するモック
      mockGame.generateActionId = jest.fn().mockReturnValue('action-123');

      const result = knight.guard(2);

      expect(result).toEqual({ success: true, actionId: 'action-123' });
      expect(mockEventEmit).toHaveBeenCalledWith('role.action.register', {
        id: 'action-123',
        type: 'guard',
        actor: 1,
        target: 2,
        night: 1,
        priority: 80
      });
    });
  });

  describe('夜アクション処理', () => {
    test('onNightActionは護衛対象を記録すること', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);

      knight.onNightAction(2, 1);

      expect(knight.lastGuardedId).toBe(2);
      expect(mockEventEmit).toHaveBeenCalledWith('guard.success', {
        knightId: 1,
        targetId: 2,
        night: 1
      });
    });
  });

  describe('イベントハンドラ', () => {
    test('イベントハンドラーがwerewolf.attackイベントを監視していること', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);

      // コンストラクタでイベントリスナーが登録されるはず
      expect(mockEventOn).toHaveBeenCalledWith('werewolf.attack', expect.any(Function));
    });

    test('handleAttackは護衛対象への攻撃をキャンセルすること', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);
      knight.lastGuardedId = 2;

      // イベントハンドラを取得
      const eventHandler = mockEventOn.mock.calls.find(
        call => call[0] === 'werewolf.attack'
      )[1];

      // 護衛対象への攻撃イベント
      const attackEvent = {
        targetId: 2,
        attackerId: 3,
        night: 1
      };

      // イベントハンドラを実行
      const result = eventHandler(attackEvent);

      expect(result).toEqual({
        canceled: true,
        knightId: 1
      });

      expect(mockEventEmit).toHaveBeenCalledWith('guard.block', {
        knightId: 1,
        targetId: 2,
        attackerId: 3,
        night: 1
      });
    });

    test('handleAttackは護衛対象以外への攻撃に干渉しないこと', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);
      knight.lastGuardedId = 2;

      // イベントハンドラを取得
      const eventHandler = mockEventOn.mock.calls.find(
        call => call[0] === 'werewolf.attack'
      )[1];

      // 別の対象への攻撃イベント
      const attackEvent = {
        targetId: 3,
        attackerId: 4,
        night: 1
      };

      // イベントハンドラを実行
      const result = eventHandler(attackEvent);

      expect(result).toBeUndefined();
      expect(mockEventEmit).not.toHaveBeenCalledWith('guard.block', expect.anything());
    });
  });

  describe('イベント処理', () => {
    test('onDeathは基底クラスの実装を呼び出すこと', () => {
      const knight = new Knight(mockGame);
      knight.assignToPlayer(1);
      knight.isAlive = true;

      knight.onDeath('execution');

      expect(knight.isAlive).toBe(false);
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionは村人陣営の勝利条件を返すこと', () => {
      const knight = new Knight(mockGame);
      expect(knight.getWinCondition()).toContain('すべての人狼を追放することで勝利します');
    });
  });
});