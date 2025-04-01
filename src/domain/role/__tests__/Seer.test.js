/**
 * 占い師（Seer）役職クラスのテスト
 */

describe('Seer', () => {
  // クラスのインポート
  let Seer;
  let Village;

  // モック依存関係
  const mockEventEmit = jest.fn();
  const mockGame = {
    eventSystem: {
      emit: mockEventEmit,
      on: jest.fn()
    },
    phaseManager: {
      getCurrentTurn: jest.fn().mockReturnValue(1)
    },
    getPlayer: jest.fn(),
    getPlayersByRole: jest.fn().mockReturnValue([])
  };

  beforeEach(() => {
    // テスト間でモジュールキャッシュをクリアして新しいインポートを保証
    jest.resetModules();
    jest.clearAllMocks();

    // モック呼び出し履歴をクリア
    mockEventEmit.mockClear();

    // Seerクラスをインポート
    Seer = require('../Seer').Seer;
    Village = require('../Village').Village;

    // デフォルトのモック設定
    mockGame.getPlayer.mockImplementation((id) => {
      if (id === 1) return { id: 1, name: 'Seer', role: { name: 'seer' }, isAlive: true };
      if (id === 2) return { id: 2, name: 'Target', role: { getFortuneResult: () => 'white' }, isAlive: true };
      if (id === 3) return { id: 3, name: 'Wolf', role: { name: 'werewolf', getFortuneResult: () => 'black' }, isAlive: true };
      if (id === 4) return { id: 4, name: 'Fox', role: { name: 'fox', getFortuneResult: () => 'white' }, isAlive: true };
      return null;
    });
  });

  describe('初期化', () => {
    test('Villageクラスを継承していること', () => {
      const seer = new Seer(mockGame);
      expect(seer).toBeInstanceOf(Village);
    });

    test('正しいプロパティで初期化されること', () => {
      const seer = new Seer(mockGame);

      expect(seer.name).toBe('seer');
      expect(seer.displayName).toBe('占い師');
      expect(seer.team).toBe('village');
      expect(seer.fortuneResults).toEqual([]);

      // メタデータ
      expect(seer.metadata.description).toContain('占い師');
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultは"white"を返すこと', () => {
      const seer = new Seer(mockGame);
      expect(seer.getFortuneResult()).toBe('white');
    });

    test('getMediumResultは"white"を返すこと', () => {
      const seer = new Seer(mockGame);
      expect(seer.getMediumResult()).toBe('white');
    });
  });

  describe('能力メソッド', () => {
    test('canUseAbilityは生存していればtrueを返すこと', () => {
      const seer = new Seer(mockGame);
      seer.isAlive = true;

      expect(seer.canUseAbility(1)).toBe(true);
    });

    test('canUseAbilityは死亡していればfalseを返すこと', () => {
      const seer = new Seer(mockGame);
      seer.isAlive = false;

      expect(seer.canUseAbility(1)).toBe(false);
    });

    test('getAbilityTargetsは生存している他のプレイヤーを返すこと', () => {
      const seer = new Seer(mockGame);
      seer.assignToPlayer(1);

      // 他のプレイヤーをモック
      const allPlayers = [
        { id: 1, name: 'Seer', isAlive: true },
        { id: 2, name: 'Target1', isAlive: true },
        { id: 3, name: 'Target2', isAlive: true },
        { id: 4, name: 'DeadTarget', isAlive: false }
      ];

      mockGame.getAlivePlayers = jest.fn().mockReturnValue(allPlayers.filter(p => p.isAlive));

      const targets = seer.getAbilityTargets();

      expect(targets).toEqual([2, 3]); // 自分(id:1)と死亡者(id:4)を除く
    });

    test('fortuneTellは占いアクションを登録すること', () => {
      const seer = new Seer(mockGame);
      seer.assignToPlayer(1);

      // ActionIDを生成するモック
      mockGame.generateActionId = jest.fn().mockReturnValue('action-123');

      const result = seer.fortuneTell(2);

      expect(result).toEqual({ success: true, actionId: 'action-123' });
      expect(mockEventEmit).toHaveBeenCalledWith('role.action.register', {
        id: 'action-123',
        type: 'fortune',
        actor: 1,
        target: 2,
        night: 1,
        priority: 100
      });
    });
  });

  describe('夜アクション処理', () => {
    test('onNightActionは占い結果を取得して保存すること', () => {
      const seer = new Seer(mockGame);
      seer.assignToPlayer(1);

      const result = seer.onNightAction(2, 1);

      expect(result).toBe('white');
      expect(seer.fortuneResults).toContainEqual({
        night: 1,
        targetId: 2,
        result: 'white',
        targetName: 'Target'
      });

      expect(mockEventEmit).toHaveBeenCalledWith('role.action.result', {
        type: 'fortune',
        actor: 1,
        target: 2,
        result: 'white',
        night: 1
      });
    });

    test('onNightActionは人狼を占った場合"black"を返すこと', () => {
      const seer = new Seer(mockGame);
      seer.assignToPlayer(1);

      const result = seer.onNightAction(3, 1);

      expect(result).toBe('black');
      expect(seer.fortuneResults).toContainEqual({
        night: 1,
        targetId: 3,
        result: 'black',
        targetName: 'Wolf'
      });
    });

    test('onNightActionは妖狐を占った場合呪殺イベントを発火すること', () => {
      const seer = new Seer(mockGame);
      seer.assignToPlayer(1);

      seer.onNightAction(4, 1);

      expect(mockEventEmit).toHaveBeenCalledWith('fox.curse', {
        foxId: 4,
        seerId: 1,
        night: 1
      });
    });
  });

  describe('イベント処理', () => {
    test('onDeathは基底クラスの実装を呼び出すこと', () => {
      const seer = new Seer(mockGame);
      seer.assignToPlayer(1);
      seer.isAlive = true;

      seer.onDeath('execution');

      expect(seer.isAlive).toBe(false);
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionは村人陣営の勝利条件を返すこと', () => {
      const seer = new Seer(mockGame);
      expect(seer.getWinCondition()).toContain('すべての人狼を追放');
    });
  });
});