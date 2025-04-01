/**
 * 妖狐（Fox）役職クラスのテスト
 */

describe('Fox', () => {
  // クラスのインポート
  let Fox;
  let ThirdParty;

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
    getPlayersByRole: jest.fn().mockReturnValue([])
  };

  beforeEach(() => {
    // テスト間でモジュールキャッシュをクリアして新しいインポートを保証
    jest.resetModules();
    jest.clearAllMocks();

    // モック呼び出し履歴をクリア
    mockEventEmit.mockClear();
    mockEventOn.mockClear();

    // Foxクラスをインポート
    Fox = require('../Fox').Fox;
    ThirdParty = require('../ThirdParty').ThirdParty;
  });

  describe('初期化', () => {
    test('ThirdPartyクラスを継承していること', () => {
      const fox = new Fox(mockGame);
      expect(fox).toBeInstanceOf(ThirdParty);
    });

    test('正しいプロパティで初期化されること', () => {
      const fox = new Fox(mockGame);

      expect(fox.name).toBe('fox');
      expect(fox.displayName).toBe('妖狐');
      expect(fox.team).toBe('fox');
      expect(fox.cursed).toBe(false);

      // メタデータ
      expect(fox.metadata.description).toContain('妖狐');
      expect(fox.metadata.winCondition).toContain('他の陣営の勝利条件達成時に生存していること');
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultは"white"を返すこと', () => {
      const fox = new Fox(mockGame);
      expect(fox.getFortuneResult()).toBe('white');
    });

    test('getMediumResultは"white"を返すこと', () => {
      const fox = new Fox(mockGame);
      expect(fox.getMediumResult()).toBe('white');
    });
  });

  describe('能力メソッド', () => {
    test('canUseAbilityはfalseを返すこと', () => {
      const fox = new Fox(mockGame);
      expect(fox.canUseAbility()).toBe(false);
    });
  });

  describe('イベント処理', () => {
    test('onTargetedは占い行動を処理し呪殺フラグを設定すること', () => {
      const fox = new Fox(mockGame);
      fox.assignToPlayer(5);

      // 占い行動
      const action = { type: 'fortune', actor: 1 };
      const result = fox.onTargeted(action, 1);

      expect(fox.cursed).toBe(true);
      expect(result).not.toBeNull();
    });

    test('onTargetedは襲撃行動を処理しキャンセルすること', () => {
      const fox = new Fox(mockGame);
      fox.assignToPlayer(5);

      // 襲撃行動
      const action = { type: 'attack', actor: 1 };
      const result = fox.onTargeted(action, 1);

      expect(result).toEqual(expect.objectContaining({
        canceled: true
      }));
    });

    test('onPhaseEndは夜フェーズ終了時に呪殺処理を行うこと', () => {
      const fox = new Fox(mockGame);
      fox.assignToPlayer(5);
      fox.cursed = true;

      fox.onPhaseEnd('night');

      expect(fox.isAlive).toBe(false);
      expect(mockEventEmit).toHaveBeenCalledWith('player.death', expect.objectContaining({
        playerId: 5,
        cause: 'curse'
      }));
    });

    test('onDeathは背徳者に通知するイベントを発火すること', () => {
      const fox = new Fox(mockGame);
      fox.assignToPlayer(5);

      fox.onDeath('execution');

      expect(mockEventEmit).toHaveBeenCalledWith('fox.death', expect.objectContaining({
        foxId: 5,
        cause: 'execution'
      }));
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionは妖狐の勝利条件を返すこと', () => {
      const fox = new Fox(mockGame);
      expect(fox.getWinCondition()).toContain('他の陣営の勝利条件達成時に生存していること');
    });
  });
});