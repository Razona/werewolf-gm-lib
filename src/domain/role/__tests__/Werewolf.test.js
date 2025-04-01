/**
 * 人狼陣営（Werewolf）役職基底クラスのテスト
 */

describe('Werewolf', () => {
  // クラスのインポート
  let Werewolf;
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

    // クラスをインポート
    Werewolf = require('../Werewolf').Werewolf;
    Role = require('../Role').Role;
  });

  describe('初期化', () => {
    test('Roleクラスを継承していること', () => {
      const werewolf = new Werewolf(mockGame);
      expect(werewolf).toBeInstanceOf(Role);
    });

    test('teamがwerewolfに設定されること', () => {
      const werewolf = new Werewolf(mockGame);
      expect(werewolf.team).toBe('werewolf');
    });

    test('勝利条件が設定されること', () => {
      const werewolf = new Werewolf(mockGame);
      expect(werewolf.metadata.winCondition).toBe("村人の数が人狼の数以下になったときに勝利します");
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultは"black"を返すこと', () => {
      const werewolf = new Werewolf(mockGame);
      expect(werewolf.getFortuneResult()).toBe('black');
    });

    test('getMediumResultは"black"を返すこと', () => {
      const werewolf = new Werewolf(mockGame);
      expect(werewolf.getMediumResult()).toBe('black');
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionは人狼陣営の勝利条件を返すこと', () => {
      const werewolf = new Werewolf(mockGame);
      expect(werewolf.getWinCondition()).toBe("村人の数が人狼の数以下になったときに勝利します");
    });
  });
});