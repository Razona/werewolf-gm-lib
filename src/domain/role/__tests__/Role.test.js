/**
 * 役職基底クラスのテスト
 */

describe('Role', () => {
  // Roleクラスのインポート
  let Role;

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

    // Roleクラスをインポート
    Role = require('../Role').Role;
  });

  describe('初期化', () => {
    test('デフォルトのプロパティで初期化されること', () => {
      const role = new Role(mockGame);

      expect(role.game).toBe(mockGame);
      expect(role.name).toBe('baseRole');
      expect(role.displayName).toBe('基本役職');
      expect(role.team).toBe('village'); // TEAMS.VILLAGEは'village'と仮定
      expect(role.playerId).toBeNull();
      expect(role.isAlive).toBe(true);
      expect(role.metadata).toEqual({
        description: "すべての役職の基底クラスです",
        abilities: [],
        winCondition: "村人陣営の勝利条件に従います"
      });
      expect(role.actions).toEqual([]);
    });
  });

  describe('プレイヤー割り当て', () => {
    test('assignToPlayerはplayerIdを設定すること', () => {
      const role = new Role(mockGame);
      role.assignToPlayer(42);

      expect(role.playerId).toBe(42);
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultはデフォルトで"white"を返すこと', () => {
      const role = new Role(mockGame);
      expect(role.getFortuneResult()).toBe('white');
    });

    test('getMediumResultはデフォルトで"white"を返すこと', () => {
      const role = new Role(mockGame);
      expect(role.getMediumResult()).toBe('white');
    });
  });

  describe('能力管理', () => {
    test('canUseAbilityはデフォルトでfalseを返すこと', () => {
      const role = new Role(mockGame);
      expect(role.canUseAbility(1)).toBe(false);
    });

    test('getAbilityTargetsはデフォルトで空配列を返すこと', () => {
      const role = new Role(mockGame);
      expect(role.getAbilityTargets()).toEqual([]);
    });
  });

  describe('役職情報', () => {
    test('getRoleInfoは自分自身の場合に完全な情報を返すこと', () => {
      const role = new Role(mockGame);
      role.assignToPlayer(5);

      const info = role.getRoleInfo(5); // 自分の視点

      expect(info).toEqual({
        name: 'baseRole',
        displayName: '基本役職',
        team: 'village',
        metadata: {
          description: "すべての役職の基底クラスです",
          abilities: [],
          winCondition: "村人陣営の勝利条件に従います"
        }
      });
    });

    test('getRoleInfoは他者の場合に部分的な情報を返すこと', () => {
      const role = new Role(mockGame);
      role.assignToPlayer(5);

      const info = role.getRoleInfo(10); // 他プレイヤーの視点

      expect(info).toEqual({
        name: 'unknown',
        displayName: '不明'
      });
    });

    test('getRoleInfoはプレイヤーが死亡し設定で許可されていれば役職を公開すること', () => {
      // ゲーム設定で役職公開を有効化
      mockGame.options = {
        regulations: {
          revealRoleOnDeath: true
        }
      };

      const role = new Role(mockGame);
      role.assignToPlayer(5);
      role.isAlive = false;

      const info = role.getRoleInfo(10); // 他プレイヤーの視点

      expect(info).toEqual({
        name: 'baseRole',
        displayName: '基本役職',
        revealed: true
      });
    });
  });

  describe('ライフサイクルメソッド', () => {
    test('onNightActionはデフォルトでnullを返すこと', () => {
      const role = new Role(mockGame);
      expect(role.onNightAction(2, 1)).toBeNull();
    });

    test('onTargetedはデフォルトでnullを返すこと', () => {
      const role = new Role(mockGame);
      expect(role.onTargeted({ type: 'test' }, 1)).toBeNull();
    });

    test('onDeathはisAliveをfalseに設定すること', () => {
      const role = new Role(mockGame);
      role.assignToPlayer(5);
      role.onDeath('test');

      expect(role.isAlive).toBe(false);
    });

    test('onGameStartは例外をスローしないこと', () => {
      const role = new Role(mockGame);
      expect(() => role.onGameStart()).not.toThrow();
    });

    test('onPhaseStartは例外をスローしないこと', () => {
      const role = new Role(mockGame);
      expect(() => role.onPhaseStart('night')).not.toThrow();
    });

    test('onPhaseEndは例外をスローしないこと', () => {
      const role = new Role(mockGame);
      expect(() => role.onPhaseEnd('night')).not.toThrow();
    });

    test('onTurnEndは例外をスローしないこと', () => {
      const role = new Role(mockGame);
      expect(() => role.onTurnEnd()).not.toThrow();
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionはデフォルトの勝利条件を返すこと', () => {
      const role = new Role(mockGame);
      expect(role.getWinCondition()).toBe("村人陣営の勝利条件に従います");
    });
  });
});