/**
 * 村人（Villager）役職クラスのテスト
 */

describe('Villager', () => {
  // クラスのインポート
  let Villager;
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

    // Villagerクラスをインポート
    Villager = require('../Villager').Villager;
    Village = require('../Village').Village;
  });

  describe('初期化', () => {
    test('Villageクラスを継承していること', () => {
      const villager = new Villager(mockGame);
      expect(villager).toBeInstanceOf(Village);
    });

    test('正しいプロパティで初期化されること', () => {
      const villager = new Villager(mockGame);

      expect(villager.name).toBe('villager');
      expect(villager.displayName).toBe('村人');
      expect(villager.team).toBe('village');

      // メタデータ
      expect(villager.metadata.description).toContain('村人');
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultは"white"を返すこと', () => {
      const villager = new Villager(mockGame);
      expect(villager.getFortuneResult()).toBe('white');
    });

    test('getMediumResultは"white"を返すこと', () => {
      const villager = new Villager(mockGame);
      expect(villager.getMediumResult()).toBe('white');
    });
  });

  describe('能力メソッド', () => {
    test('canUseAbilityはfalseを返すこと', () => {
      const villager = new Villager(mockGame);
      expect(villager.canUseAbility()).toBe(false);
    });
  });

  describe('イベント処理', () => {
    test('onDeathは基底クラスの実装を呼び出すこと', () => {
      const villager = new Villager(mockGame);
      villager.assignToPlayer(1);
      villager.isAlive = true;

      villager.onDeath('execution');

      expect(villager.isAlive).toBe(false);
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionは村人陣営の勝利条件を返すこと', () => {
      const villager = new Villager(mockGame);
      expect(villager.getWinCondition()).toContain('すべての人狼を追放');
    });
  });
});