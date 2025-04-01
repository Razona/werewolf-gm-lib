/**
 * 村人陣営（Village）役職基底クラスのテスト
 */

describe('Village', () => {
  // クラスのインポート
  let Village;
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
    Village = require('../Village').Village;
    Role = require('../Role').Role;
  });

  describe('初期化', () => {
    test('Roleクラスを継承していること', () => {
      const village = new Village(mockGame);
      expect(village).toBeInstanceOf(Role);
    });

    test('teamがvillageに設定されること', () => {
      const village = new Village(mockGame);
      expect(village.team).toBe('village');
    });

    test('勝利条件が設定されること', () => {
      const village = new Village(mockGame);
      expect(village.metadata.winCondition).toBe("すべての人狼を追放することで勝利します");
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultは"white"を返すこと', () => {
      const village = new Village(mockGame);
      expect(village.getFortuneResult()).toBe('white');
    });

    test('getMediumResultは"white"を返すこと', () => {
      const village = new Village(mockGame);
      expect(village.getMediumResult()).toBe('white');
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionは村人陣営の勝利条件を返すこと', () => {
      const village = new Village(mockGame);
      expect(village.getWinCondition()).toBe("すべての人狼を追放することで勝利します");
    });
  });
});