/**
 * 共有者（Mason）役職クラスのテスト
 */

describe('Mason', () => {
  // クラスのインポート
  let Mason;
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
    getPlayersByRole: jest.fn()
  };

  beforeEach(() => {
    // テスト間でモジュールキャッシュをクリアして新しいインポートを保証
    jest.resetModules();
    jest.clearAllMocks();

    // モック呼び出し履歴をクリア
    mockEventEmit.mockClear();

    // Masonクラスをインポート
    Mason = require('../Mason').Mason;
    Village = require('../Village').Village;

    // デフォルトのモック戻り値を設定
    mockGame.getPlayersByRole.mockReturnValue([]);
  });

  describe('初期化', () => {
    test('Villageクラスを継承していること', () => {
      const mason = new Mason(mockGame);
      expect(mason).toBeInstanceOf(Village);
    });

    test('正しいプロパティで初期化されること', () => {
      const mason = new Mason(mockGame);

      expect(mason.name).toBe('mason');
      expect(mason.displayName).toBe('共有者');
      expect(mason.team).toBe('village');

      // メタデータ
      expect(mason.metadata.description).toContain('共有者');
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultは"white"を返すこと', () => {
      const mason = new Mason(mockGame);
      expect(mason.getFortuneResult()).toBe('white');
    });

    test('getMediumResultは"white"を返すこと', () => {
      const mason = new Mason(mockGame);
      expect(mason.getMediumResult()).toBe('white');
    });
  });

  describe('能力メソッド', () => {
    test('canUseAbilityはfalseを返すこと', () => {
      const mason = new Mason(mockGame);
      expect(mason.canUseAbility()).toBe(false);
    });

    test('getPartnersは他の共有者を返すこと', () => {
      const mason = new Mason(mockGame);
      mason.assignToPlayer(1);

      // 他の共有者をモック
      const otherMasons = [
        { id: 2, name: 'Mason2', role: { name: 'mason' }, isAlive: true },
        { id: 3, name: 'Mason3', role: { name: 'mason' }, isAlive: true }
      ];

      mockGame.getPlayersByRole.mockReturnValue([
        { id: 1, name: 'Mason1', role: { name: 'mason' }, isAlive: true },
        ...otherMasons
      ]);

      const partners = mason.getPartners();

      expect(partners).toHaveLength(2);
      expect(partners[0].id).toBe(2);
      expect(partners[1].id).toBe(3);
    });

    test('getPartnersは死亡した共有者を含めないこと', () => {
      const mason = new Mason(mockGame);
      mason.assignToPlayer(1);

      mockGame.getPlayersByRole.mockReturnValue([
        { id: 1, name: 'Mason1', role: { name: 'mason' }, isAlive: true },
        { id: 2, name: 'Mason2', role: { name: 'mason' }, isAlive: true },
        { id: 3, name: 'Mason3', role: { name: 'mason' }, isAlive: false } // 死亡
      ]);

      const partners = mason.getPartners();

      expect(partners).toHaveLength(1);
      expect(partners[0].id).toBe(2);
    });
  });

  describe('イベント処理', () => {
    test('onGameStartは共有者同士の認識イベントを発火すること', () => {
      const mason = new Mason(mockGame);
      mason.assignToPlayer(1);

      // 他の共有者をモック
      const otherMasons = [
        { id: 2, name: 'Mason2', role: { name: 'mason' }, isAlive: true },
        { id: 3, name: 'Mason3', role: { name: 'mason' }, isAlive: true }
      ];

      mockGame.getPlayersByRole.mockReturnValue([
        { id: 1, name: 'Mason1', role: { name: 'mason' }, isAlive: true },
        ...otherMasons
      ]);

      mason.onGameStart();

      expect(mockEventEmit).toHaveBeenCalledWith('mason.recognize', {
        masonId: 1,
        partners: [2, 3]
      });
    });

    test('onGameStartは他の共有者がいない場合イベントを発火しないこと', () => {
      const mason = new Mason(mockGame);
      mason.assignToPlayer(1);

      mockGame.getPlayersByRole.mockReturnValue([
        { id: 1, name: 'Mason1', role: { name: 'mason' }, isAlive: true }
      ]);

      mason.onGameStart();

      expect(mockEventEmit).not.toHaveBeenCalled();
    });

    test('onDeathは死亡イベントを発火すること', () => {
      const mason = new Mason(mockGame);
      mason.assignToPlayer(1);

      // 他の共有者をモック
      const otherMasons = [
        { id: 2, name: 'Mason2', role: { name: 'mason' }, isAlive: true },
        { id: 3, name: 'Mason3', role: { name: 'mason' }, isAlive: true }
      ];

      mockGame.getPlayersByRole.mockReturnValue([
        { id: 1, name: 'Mason1', role: { name: 'mason' }, isAlive: true },
        ...otherMasons
      ]);

      mason.onDeath('execution');

      expect(mockEventEmit).toHaveBeenCalledWith('mason.death', {
        masonId: 1,
        cause: 'execution',
        partners: [2, 3]
      });
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionは村人陣営の勝利条件を返すこと', () => {
      const mason = new Mason(mockGame);
      expect(mason.getWinCondition()).toContain('すべての人狼を追放');
    });
  });
});