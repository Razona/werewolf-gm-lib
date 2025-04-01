/**
 * 霊媒師（Medium）役職クラスのテスト
 */

describe('Medium', () => {
  // クラスのインポート
  let Medium;
  let Village;

  // モック依存関係
  const mockEventEmit = jest.fn();
  const mockGame = {
    eventSystem: {
      emit: mockEventEmit,
      on: jest.fn()
    },
    phaseManager: {
      getCurrentTurn: jest.fn().mockReturnValue(1),
      getCurrentPhase: jest.fn().mockReturnValue('night')
    },
    getPlayer: jest.fn(),
    getPlayersByRole: jest.fn().mockReturnValue([]),
    getLastExecutedPlayer: jest.fn().mockReturnValue(null)
  };

  beforeEach(() => {
    // テスト間でモジュールキャッシュをクリアして新しいインポートを保証
    jest.resetModules();
    jest.clearAllMocks();

    // モック呼び出し履歴をクリア
    mockEventEmit.mockClear();

    // Mediumクラスをインポート
    Medium = require('../Medium').Medium;
    Village = require('../Village').Village;

    // デフォルトのモック設定
    mockGame.getPlayer.mockImplementation((id) => {
      if (id === 1) return { id: 1, name: 'Medium', role: { name: 'medium' }, isAlive: true };
      if (id === 2) return { id: 2, name: 'Villager', role: { getMediumResult: () => 'white' }, isAlive: false, causeOfDeath: 'execution' };
      if (id === 3) return { id: 3, name: 'Wolf', role: { name: 'werewolf', getMediumResult: () => 'black' }, isAlive: false, causeOfDeath: 'execution' };
      return null;
    });
  });

  describe('初期化', () => {
    test('Villageクラスを継承していること', () => {
      const medium = new Medium(mockGame);
      expect(medium).toBeInstanceOf(Village);
    });

    test('正しいプロパティで初期化されること', () => {
      const medium = new Medium(mockGame);

      expect(medium.name).toBe('medium');
      expect(medium.displayName).toBe('霊媒師');
      expect(medium.team).toBe('village');
      expect(medium.mediumResults).toEqual([]);

      // メタデータ
      expect(medium.metadata.description).toContain('霊媒師');
    });
  });

  describe('占い・霊媒結果', () => {
    test('getFortuneResultは"white"を返すこと', () => {
      const medium = new Medium(mockGame);
      expect(medium.getFortuneResult()).toBe('white');
    });

    test('getMediumResultは"white"を返すこと', () => {
      const medium = new Medium(mockGame);
      expect(medium.getMediumResult()).toBe('white');
    });
  });

  describe('能力メソッド', () => {
    test('canUseAbilityは前日に処刑があればtrueを返すこと', () => {
      const medium = new Medium(mockGame);
      medium.isAlive = true;

      // 処刑されたプレイヤーがいる
      mockGame.getLastExecutedPlayer.mockReturnValue({ id: 2, name: 'Villager' });

      expect(medium.canUseAbility(1)).toBe(true);
    });

    test('canUseAbilityは前日に処刑がなければfalseを返すこと', () => {
      const medium = new Medium(mockGame);
      medium.isAlive = true;

      // 処刑されたプレイヤーがいない
      mockGame.getLastExecutedPlayer.mockReturnValue(null);

      expect(medium.canUseAbility(1)).toBe(false);
    });

    test('canUseAbilityは死亡していればfalseを返すこと', () => {
      const medium = new Medium(mockGame);
      medium.isAlive = false;

      // 処刑されたプレイヤーがいる
      mockGame.getLastExecutedPlayer.mockReturnValue({ id: 2, name: 'Villager' });

      expect(medium.canUseAbility(1)).toBe(false);
    });

    test('getAbilityTargetsは前日に処刑されたプレイヤーを返すこと', () => {
      const medium = new Medium(mockGame);

      // 処刑されたプレイヤーがいる
      mockGame.getLastExecutedPlayer.mockReturnValue({ id: 2, name: 'Villager' });

      const targets = medium.getAbilityTargets();

      expect(targets).toEqual([2]);
    });

    test('getAbilityTargetsは前日に処刑がなければ空配列を返すこと', () => {
      const medium = new Medium(mockGame);

      // 処刑されたプレイヤーがいない
      mockGame.getLastExecutedPlayer.mockReturnValue(null);

      const targets = medium.getAbilityTargets();

      expect(targets).toEqual([]);
    });

    test('performMediumは霊媒結果を返すこと', () => {
      const medium = new Medium(mockGame);
      medium.assignToPlayer(1);

      // 処刑された村人
      mockGame.getLastExecutedPlayer.mockReturnValue({ id: 2, name: 'Villager' });

      const result = medium.performMedium();

      expect(result).toBe('white');
      expect(medium.mediumResults).toContainEqual({
        turn: 1,
        targetId: 2,
        result: 'white',
        targetName: 'Villager'
      });

      expect(mockEventEmit).toHaveBeenCalledWith('role.action.result', {
        type: 'medium',
        actor: 1,
        target: 2,
        result: 'white',
        turn: 1
      });
    });

    test('performMediumは人狼の場合"black"を返すこと', () => {
      const medium = new Medium(mockGame);
      medium.assignToPlayer(1);

      // 処刑された人狼
      mockGame.getLastExecutedPlayer.mockReturnValue({ id: 3, name: 'Wolf' });

      const result = medium.performMedium();

      expect(result).toBe('black');
      expect(medium.mediumResults).toContainEqual({
        turn: 1,
        targetId: 3,
        result: 'black',
        targetName: 'Wolf'
      });
    });

    test('performMediumは処刑者がいない場合nullを返すこと', () => {
      const medium = new Medium(mockGame);
      medium.assignToPlayer(1);

      // 処刑されたプレイヤーがいない
      mockGame.getLastExecutedPlayer.mockReturnValue(null);

      const result = medium.performMedium();

      expect(result).toBeNull();
      expect(medium.mediumResults).toHaveLength(0);
      expect(mockEventEmit).not.toHaveBeenCalled();
    });
  });

  describe('夜フェーズ処理', () => {
    test('onPhaseStartは夜フェーズでもし処刑者がいれば自動的に霊媒を実行すること', () => {
      const medium = new Medium(mockGame);
      medium.assignToPlayer(1);
      medium.performMedium = jest.fn().mockReturnValue('white');

      // 処刑されたプレイヤーがいる
      mockGame.getLastExecutedPlayer.mockReturnValue({ id: 2, name: 'Villager' });

      medium.onPhaseStart('night');

      expect(medium.performMedium).toHaveBeenCalled();
    });

    test('onPhaseStartは夜フェーズ以外では霊媒を実行しないこと', () => {
      const medium = new Medium(mockGame);
      medium.assignToPlayer(1);
      medium.performMedium = jest.fn();

      medium.onPhaseStart('day');

      expect(medium.performMedium).not.toHaveBeenCalled();
    });
  });

  describe('イベント処理', () => {
    test('onDeathは基底クラスの実装を呼び出すこと', () => {
      const medium = new Medium(mockGame);
      medium.assignToPlayer(1);
      medium.isAlive = true;

      medium.onDeath('execution');

      expect(medium.isAlive).toBe(false);
    });
  });

  describe('勝利条件', () => {
    test('getWinConditionは村人陣営の勝利条件を返すこと', () => {
      const medium = new Medium(mockGame);
      expect(medium.getWinCondition()).toContain('すべての人狼を追放');
    });
  });
});