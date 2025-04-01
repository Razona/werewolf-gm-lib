/**
 * 第三陣営（ThirdParty）役職基底クラスのテスト
 */

describe('ThirdParty', () => {
  // クラスのインポート
  let ThirdParty;
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
    ThirdParty = require('../ThirdParty').ThirdParty;
    Role = require('../Role').Role;
  });

  describe('初期化', () => {
    test('Roleクラスを継承していること', () => {
      const thirdParty = new ThirdParty(mockGame);
      expect(thirdParty).toBeInstanceOf(Role);
    });

    test('teamがfoxに設定されること', () => {
      const thirdParty = new ThirdParty(mockGame);
      expect(thirdParty.team).toBe('fox');
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionはmetadata内の値を返すこと', () => {
      const thirdParty = new ThirdParty(mockGame);
      thirdParty.metadata.winCondition = "カスタム勝利条件";
      expect(thirdParty.getWinCondition()).toBe("カスタム勝利条件");
    });
  });
});